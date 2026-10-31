import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { appBaseUrl, RESET_TTL_MS, createAuthToken, invalidateAuthTokens } from "@/lib/auth";
import { normalizeEmail, validateEmail } from "@/lib/auth-validation";
import { resetPasswordEmail } from "@/lib/email-templates";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadPersistentDb } from "@/lib/store";

const MINUTES = Math.round(RESET_TTL_MS / 60000);

export async function POST(request: NextRequest) {
  const limit = hitRateLimit(`forgot:${clientIp(request)}`, 6, 15 * 60 * 1000);
  if (!limit.ok) {
    return fail("Terlalu banyak permintaan reset. Coba lagi nanti.", 429);
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

  const db = await loadPersistentDb();
  const user = db.users.find((item) => item.email === email);

  // Selalu balas pesan generik agar keberadaan email tidak bisa ditebak.
  const generic = {
    ok: true,
    message: "Bila email terdaftar, tautan reset password sudah dikirim.",
  };

  if (!user?.emailVerified) return NextResponse.json(generic);

  await invalidateAuthTokens(user.id, "reset");
  const { raw } = await createAuthToken(user.id, "reset", RESET_TTL_MS);
  const link = `${appBaseUrl(request.nextUrl.origin)}/reset-password?token=${encodeURIComponent(raw)}`;
  const mail = resetPasswordEmail({ username: user.username, link, minutes: MINUTES });
  const result = await sendMail({ to: user.email, ...mail });

  return NextResponse.json({
    ...generic,
    devLink:
      !result.delivered && process.env.NODE_ENV !== "production" ? link : undefined,
  });
}
