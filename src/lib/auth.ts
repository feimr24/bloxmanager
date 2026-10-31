import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadDb, saveDb } from "./store";
import type { AuthSession, AuthToken, AuthTokenType, User } from "./types";

export const SESSION_COOKIE = "blox_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

function randomToken() {
  return randomBytes(32).toString("base64url");
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
  const db = loadDb();
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
  saveDb(db);

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

  const db = loadDb();
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
  const session = loadDb().authSessions.find((item) => item.tokenHash === tokenHash);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

export function listUserSessions(userId: string) {
  return loadDb()
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
    const db = loadDb();
    const tokenHash = hashToken(raw);
    db.authSessions = db.authSessions.filter((item) => item.tokenHash !== tokenHash);
    saveDb(db);
  }
  store.delete(SESSION_COOKIE);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function revokeUserSessions(userId: string) {
  const db = loadDb();
  db.authSessions = db.authSessions.filter((session) => session.userId !== userId);
  saveDb(db);
}

export function createAuthToken(userId: string, type: AuthTokenType, ttlMs: number) {
  const db = loadDb();
  const now = Date.now();
  const raw = randomToken();
  const token: AuthToken = {
    id: id("tok"),
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(now + ttlMs).toISOString(),
    createdAt: new Date(now).toISOString(),
  };
  db.authTokens.push(token);
  saveDb(db);
  return { raw, token };
}

export function consumeAuthToken(raw: string, type: AuthTokenType) {
  if (!raw) return null;
  const db = loadDb();
  const tokenHash = hashToken(raw);
  const token = db.authTokens.find(
    (item) => item.tokenHash === tokenHash && item.type === type,
  );
  if (!token || token.usedAt) return null;
  if (new Date(token.expiresAt).getTime() <= Date.now()) return null;

  token.usedAt = new Date().toISOString();
  saveDb(db);
  return token;
}

/** Ambil token tanpa menandainya terpakai (untuk verifikasi idempoten). */
export function peekAuthToken(raw: string, type: AuthTokenType) {
  if (!raw) return null;
  const db = loadDb();
  const tokenHash = hashToken(raw);
  return (
    db.authTokens.find((item) => item.tokenHash === tokenHash && item.type === type) ?? null
  );
}

/** Hanya token verifikasi terbaru yang berlaku; token lama dihapus. */export function invalidateAuthTokens(userId: string, type: AuthTokenType) {
  const db = loadDb();
  db.authTokens = db.authTokens.filter(
    (token) => !(token.userId === userId && token.type === type && !token.usedAt),
  );
  saveDb(db);
}
