import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api";
import {
  appBaseUrl,
  createAuthToken,
  invalidateAuthTokens,
  VERIFY_TTL_MS,
} from "@/lib/auth";
import { normalizeEmail, validateEmail } from "@/lib/auth-validation";
import { verificationEmail } from "@/lib/email-templates";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadPersistentDb } from "@/lib/store";

export async function POST(request: NextRequest) {
  const limit = hitRateLimit(`resend:${clientIp(request)}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return fail("Terlalu banyak permintaan. Coba lagi nanti.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const email = normalizeEmail(body.email);
  const emailError = validateEmail(email);
  if (emailError) return fail(emailError);
  if (process.env.NODE_ENV === "production" && !isMailConfigured()) {
    return fail("Email belum aktif di server. Administrator perlu melengkapi konfigurasi Resend.", 503);
  }

  const generic = {
    ok: true,
    message: "Bila email terdaftar dan belum diverifikasi, tautan baru sudah dikirim.",
  };

  const db = await loadPersistentDb();
  const user = db.users.find((item) => item.email === email);
  const pending = db.pendingRegistrations.find(
    (item) => item.email === email && new Date(item.expiresAt).getTime() > Date.now(),
  );
  if ((!user || user.emailVerified) && !pending) return NextResponse.json(generic);

  const userId = pending?.id ?? user?.id;
  const username = pending?.username ?? user?.username;
  if (!userId || !username) return NextResponse.json(generic);
  await invalidateAuthTokens(userId, "verify");
  const { raw } = await createAuthToken(userId, "verify", VERIFY_TTL_MS);
  const link = `${appBaseUrl(request.nextUrl.origin)}/verify-email?token=${encodeURIComponent(raw)}`;
  const mail = verificationEmail({ username, link });
  const result = await sendMail({ to: email, ...mail });

  if (!result.delivered && process.env.NODE_ENV === "production") {
    return fail("Email verifikasi belum dapat dikirim. Silakan coba lagi nanti atau hubungi administrator.", 502);
  }

  return NextResponse.json({
    ...generic,
    message: result.delivered
      ? generic.message
      : "Mode pengembangan: email tidak terkirim, gunakan tautan verifikasi lokal.",
    emailSent: result.delivered,
    devLink:
      !result.delivered && process.env.NODE_ENV !== "production" ? link : undefined,
  });
}
