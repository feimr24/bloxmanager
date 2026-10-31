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
import { sendMail } from "@/lib/mailer";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadDb } from "@/lib/store";

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

  const generic = {
    ok: true,
    message: "Bila email terdaftar dan belum diverifikasi, tautan baru sudah dikirim.",
  };

  const db = loadDb();
  const user = db.users.find((item) => item.email === email);
  if (!user || user.emailVerified) return NextResponse.json(generic);

  invalidateAuthTokens(user.id, "verify");
  const { raw } = createAuthToken(user.id, "verify", VERIFY_TTL_MS);
  const link = `${appBaseUrl(request.nextUrl.origin)}/verify-email?token=${encodeURIComponent(raw)}`;
  const mail = verificationEmail({ username: user.username, link });
  const result = await sendMail({ to: user.email, ...mail });

  return NextResponse.json({
    ...generic,
    devLink:
      !result.delivered && process.env.NODE_ENV !== "production" ? link : undefined,
  });
}
