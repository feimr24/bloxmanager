import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { consumeAuthToken, revokeUserSessions } from "@/lib/auth";
import { validatePassword } from "@/lib/auth-validation";
import { hashPassword } from "@/lib/password";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";

export async function POST(request: NextRequest) {
  const limit = hitRateLimit(`reset:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return fail("Terlalu banyak percobaan. Coba lagi nanti.", 429);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");
  if (!token) return fail("Token reset tidak ditemukan");

  const passwordError = validatePassword(password);
  if (passwordError) return fail(passwordError);

  const record = await consumeAuthToken(token, "reset");
  if (!record) {
    return fail("Tautan reset tidak valid atau sudah kedaluwarsa.", 400);
  }

  const db = await loadPersistentDb();
  const user = db.users.find((item) => item.id === record.userId);
  if (!user?.emailVerified) return fail("Akun terverifikasi tidak ditemukan", 404);

  user.passwordHash = await hashPassword(password);
  user.updatedAt = new Date().toISOString();
  await savePersistentDb(db);

  await revokeUserSessions(user.id);

  return ok({ ok: true, username: user.username });
}
