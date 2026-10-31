import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadPersistentDb, savePersistentDb } from "./store";
import type { AuthSession, User } from "./types";

export const SESSION_COOKIE = "blox_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function randomToken() {
  return randomBytes(32).toString("base64url");
}

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
}

export function appBaseUrl(origin?: string) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return origin?.replace(/\/+$/, "") ?? "http://localhost:3000";
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ip?: string },
) {
  const db = await loadPersistentDb();
  const now = Date.now();

  // Bersihkan sesi kedaluwarsa agar file database tidak membengkak.
  db.authSessions = db.authSessions.filter(
    (session) => new Date(session.expiresAt).getTime() > now,
  );

  const raw = randomToken();
  const expiresAt = new Date(now + SESSION_TTL_MS);
  const session: AuthSession = {
    id: id("ses"),
    userId,
    tokenHash: hashToken(raw),
    createdAt: new Date(now).toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: meta?.userAgent,
    ip: meta?.ip,
  };
  db.authSessions.push(session);
  await savePersistentDb(db);

  const store = await cookies();
  store.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { raw, expiresAt: expiresAt.toISOString() };
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const db = await loadPersistentDb();
  const tokenHash = hashToken(raw);
  const session = db.authSessions.find((item) => item.tokenHash === tokenHash);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;

  return db.users.find((user) => user.id === session.userId) ?? null;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const tokenHash = hashToken(raw);
  const session = (await loadPersistentDb()).authSessions.find((item) => item.tokenHash === tokenHash);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

export async function listUserSessions(userId: string) {
  return (await loadPersistentDb())
    .authSessions.filter(
      (session) =>
        session.userId === userId && new Date(session.expiresAt).getTime() > Date.now(),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Untuk server component halaman yang wajib login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    const db = await loadPersistentDb();
    const tokenHash = hashToken(raw);
    db.authSessions = db.authSessions.filter((item) => item.tokenHash !== tokenHash);
    await savePersistentDb(db);
  }
  store.delete(SESSION_COOKIE);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function revokeUserSessions(userId: string) {
  const db = await loadPersistentDb();
  db.authSessions = db.authSessions.filter((session) => session.userId !== userId);
  await savePersistentDb(db);
}
