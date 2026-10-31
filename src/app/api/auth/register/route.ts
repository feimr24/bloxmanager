import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import {
  appBaseUrl,
  createAuthToken,
  invalidateAuthTokens,
  VERIFY_TTL_MS,
} from "@/lib/auth";
import { normalizeEmail, validateEmail, validatePassword, validateUsername } from "@/lib/auth-validation";
import { verificationEmail } from "@/lib/email-templates";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { hashPassword } from "@/lib/password";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";
import type { PendingRegistration } from "@/lib/types";

export async function POST(request: NextRequest) {
  const limit = hitRateLimit(`register:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return fail("Terlalu banyak percobaan pendaftaran. Coba lagi nanti.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const email = normalizeEmail(body.email);
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  const errors = [
    validateEmail(email),
    validateUsername(username),
    validatePassword(password),
  ].filter(Boolean);
  if (errors.length > 0) return fail(errors[0] as string);
  if (process.env.NODE_ENV === "production" && !isMailConfigured()) {
    return fail(
      "Email belum aktif di server (RESEND_API_KEY dan MAIL_FROM). Akun belum dibuat; administrator perlu melengkapi konfigurasi Resend.",
      503,
    );
  }

  const db = await loadPersistentDb();
  db.pendingRegistrations = db.pendingRegistrations.filter(
    (item) => new Date(item.expiresAt).getTime() > Date.now(),
  );
  if (db.users.some((user) => user.email === email)) {
    return fail("Email sudah terdaftar. Silakan masuk atau reset password.", 409);
  }
  const pendingForEmail = db.pendingRegistrations.find((item) => item.email === email);
  if (
    db.users.some((user) => user.username.toLowerCase() === username.toLowerCase()) ||
    db.pendingRegistrations.some(
      (item) =>
        item.email !== email && item.username.toLowerCase() === username.toLowerCase(),
    )
  ) {
    return fail("Username sudah dipakai. Pilih username lain.", 409);
  }

  const now = new Date().toISOString();
  const pending: PendingRegistration = {
    id: pendingForEmail?.id ?? `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    email,
    username,
    passwordHash: await hashPassword(password),
    createdAt: now,
    expiresAt: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
  };
  db.pendingRegistrations = db.pendingRegistrations.filter((item) => item.email !== email);
  db.pendingRegistrations.push(pending);
  await savePersistentDb(db);

  await invalidateAuthTokens(pending.id, "verify");
  const { raw } = await createAuthToken(pending.id, "verify", VERIFY_TTL_MS);
  const link = `${appBaseUrl(request.nextUrl.origin)}/verify-email?token=${encodeURIComponent(raw)}`;
  const mail = verificationEmail({ username, link });
  const result = await sendMail({ to: email, ...mail });

  if (!result.delivered && process.env.NODE_ENV === "production") {
    const latest = await loadPersistentDb();
    latest.pendingRegistrations = latest.pendingRegistrations.filter(
      (item) => item.id !== pending.id,
    );
    latest.authTokens = latest.authTokens.filter(
      (item) => !(item.userId === pending.id && item.type === "verify" && !item.usedAt),
    );
    await savePersistentDb(latest);
    return fail(
      "Email verifikasi gagal dikirim. Akun belum dibuat. Silakan coba lagi nanti atau hubungi administrator.",
      502,
    );
  }

  return ok(
    {
      ok: true,
      emailSent: result.delivered,
      message: result.delivered
        ? "Permintaan pendaftaran diterima. Akun akan dibuat setelah email diverifikasi."
        : "Email tidak dikirim (mode pengembangan). Permintaan pendaftaran menunggu verifikasi lewat tautan di bawah.",
      devLink: result.delivered ? undefined : link,
    },
    201,
  );
}
