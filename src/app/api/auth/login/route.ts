import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { clientIp, hitRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");
  if (!identifier || !password) {
    return fail("Email/username dan password wajib diisi");
  }

  const limitKey = `login:${clientIp(request)}:${identifier.toLowerCase()}`;
  const limit = hitRateLimit(limitKey, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return fail(
      `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(limit.retryAfterSeconds / 60)} menit.`,
      429,
    );
  }

  const db = await loadPersistentDb();
  const needle = identifier.toLowerCase();
  const user = db.users.find(
    (item) => item.email === needle || item.username.toLowerCase() === needle,
  );

  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    return fail("Email/username atau password salah", 401);
  }

  resetRateLimit(limitKey);
  user.lastLoginAt = new Date().toISOString();
  await savePersistentDb(db);
  await createSession(user.id, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: clientIp(request),
  });

  return ok({
    ok: true,
    user: { id: user.id, username: user.username, email: user.email },
  });
}
