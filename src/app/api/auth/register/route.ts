import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { normalizeEmail, validateEmail, validatePassword, validateUsername } from "@/lib/auth-validation";
import { hashPassword } from "@/lib/password";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";

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
  const db = await loadPersistentDb();
  if (db.users.some((user) => user.email === email)) {
    return fail("Email sudah terdaftar. Silakan masuk atau hubungi admin jika lupa password.", 409);
  }
  if (db.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return fail("Username sudah dipakai. Pilih username lain.", 409);
  }

  const now = new Date().toISOString();
  const user = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    email,
    username,
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(user);
  await savePersistentDb(db);
  await createSession(user.id, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: clientIp(request),
  });

  return ok({
    ok: true,
    user: { id: user.id, username: user.username, email: user.email },
  }, 201);
}
