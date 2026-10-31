import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = hitRateLimit(`forgot:${clientIp(request)}`, 6, 15 * 60 * 1000);
  if (!limit.ok) {
    return fail("Terlalu banyak permintaan reset. Coba lagi nanti.", 429);
  }

  try {
    await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  return NextResponse.json({
    ok: true,
    message: "Reset password melalui email belum tersedia. Silakan hubungi admin.",
  });
}
