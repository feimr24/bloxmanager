import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { consumeAuthToken, peekAuthToken } from "@/lib/auth";
import { loadDb, saveDb } from "@/lib/store";

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

  const record = consumeAuthToken(token, "verify");
  if (!record) {
    const previous = peekAuthToken(token, "verify");
    if (previous?.usedAt) {
      const age = Date.now() - new Date(previous.usedAt).getTime();
      const db = loadDb();
      const user = db.users.find((item) => item.id === previous.userId);
      if (user?.emailVerified && age >= 0 && age <= REUSE_WINDOW_MS) {
        return SUCCESS(user.username, user.email);
      }
    }
    return fail("Tautan verifikasi tidak valid atau sudah kedaluwarsa.", 400);
  }

  const db = loadDb();
  const user = db.users.find((item) => item.id === record.userId);
  if (!user) return fail("Akun tidak ditemukan", 404);

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    saveDb(db);
  }

  return SUCCESS(user.username, user.email);
}
