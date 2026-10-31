import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { consumeAuthToken, peekAuthToken } from "@/lib/auth";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";

/** Verifikasi bisa dipanggil dua kali (mis. React Strict Mode); token yang
 *  baru saja dipakai untuk akun yang sama tetap dianggap berhasil. */
const REUSE_WINDOW_MS = 15 * 60 * 1000;
const SUCCESS = (username: string, email: string) =>
  ok({ ok: true, user: { username, email } });

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const token = String(body.token ?? "").trim();
  if (!token) return fail("Token verifikasi tidak ditemukan");

  const record = await consumeAuthToken(token, "verify");
  if (!record) {
    const previous = await peekAuthToken(token, "verify");
    if (previous?.usedAt) {
      const age = Date.now() - new Date(previous.usedAt).getTime();
      const db = await loadPersistentDb();
      const user = db.users.find((item) => item.id === previous.userId);
      if (user?.emailVerified && age >= 0 && age <= REUSE_WINDOW_MS) {
        return SUCCESS(user.username, user.email);
      }
    }
    return fail("Tautan verifikasi tidak valid atau sudah kedaluwarsa.", 400);
  }

  const db = await loadPersistentDb();
  const pending = db.pendingRegistrations.find((item) => item.id === record.userId);
  if (pending) {
    if (new Date(pending.expiresAt).getTime() <= Date.now()) {
      db.pendingRegistrations = db.pendingRegistrations.filter((item) => item.id !== pending.id);
      await savePersistentDb(db);
      return fail("Tautan verifikasi sudah kedaluwarsa. Silakan daftar ulang.", 400);
    }

    const conflict = db.users.some(
      (item) =>
        item.email === pending.email ||
        item.username.toLowerCase() === pending.username.toLowerCase(),
    );
    if (conflict) {
      db.pendingRegistrations = db.pendingRegistrations.filter((item) => item.id !== pending.id);
      await savePersistentDb(db);
      return fail("Email atau username sudah digunakan. Silakan hubungi administrator.", 409);
    }

    const now = new Date().toISOString();
    db.users.push({
      id: pending.id,
      email: pending.email,
      username: pending.username,
      passwordHash: pending.passwordHash,
      emailVerified: true,
      createdAt: pending.createdAt,
      updatedAt: now,
    });
    db.pendingRegistrations = db.pendingRegistrations.filter((item) => item.id !== pending.id);
    await savePersistentDb(db);
    return SUCCESS(pending.username, pending.email);
  }

  // Preserve verification links issued before registrations became pending.
  const user = db.users.find((item) => item.id === record.userId);
  if (!user) return fail("Permintaan pendaftaran tidak ditemukan atau sudah dibatalkan.", 404);

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    await savePersistentDb(db);
  }

  return SUCCESS(user.username, user.email);
}
