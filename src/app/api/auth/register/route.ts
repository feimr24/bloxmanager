import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { appBaseUrl, createAuthToken, VERIFY_TTL_MS } from "@/lib/auth";
import { normalizeEmail, validateEmail, validatePassword, validateUsername } from "@/lib/auth-validation";
import { verificationEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { hashPassword } from "@/lib/password";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadDb, saveDb } from "@/lib/store";
import type { User } from "@/lib/types";

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

  const db = loadDb();
  if (db.users.some((user) => user.email === email)) {
    return fail("Email sudah terdaftar. Silakan masuk atau reset password.", 409);
  }
  if (db.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return fail("Username sudah dipakai. Pilih username lain.", 409);
  }

  const now = new Date().toISOString();
  const user: User = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    email,
    username,
    passwordHash: await hashPassword(password),
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(user);
  saveDb(db);

  const { raw } = createAuthToken(user.id, "verify", VERIFY_TTL_MS);
  const link = `${appBaseUrl(request.nextUrl.origin)}/verify-email?token=${encodeURIComponent(raw)}`;
  const mail = verificationEmail({ username, link });
  const result = await sendMail({ to: email, ...mail });

  if (!result.delivered && process.env.NODE_ENV === "production") {
    return fail("Akun dibuat, tetapi email verifikasi gagal dikirim. Coba kirim ulang.", 502);
  }

  return ok(
    {
      ok: true,
      emailSent: result.delivered,
      message: result.delivered
        ? "Akun dibuat. Cek inbox email untuk verifikasi."
        : "Akun dibuat. Resend belum dikonfigurasi, gunakan tautan verifikasi mode pengembangan.",
      devLink: result.delivered ? undefined : link,
    },
    201,
  );
}
