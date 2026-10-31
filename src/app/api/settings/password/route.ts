import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { getCurrentSession, getCurrentUser } from "@/lib/auth";
import { validatePassword } from "@/lib/auth-validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";

export async function POST(request: NextRequest) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return fail("Sesi berakhir. Silakan masuk kembali.", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!currentPassword) return fail("Password saat ini wajib diisi");
  const passwordError = validatePassword(newPassword);
  if (passwordError) return fail(passwordError);
  if (currentPassword === newPassword) {
    return fail("Password baru harus berbeda dari password saat ini");
  }

  const okCurrent = await verifyPassword(currentPassword, user.passwordHash);
  if (!okCurrent) return fail("Password saat ini salah", 401);

  const db = await loadPersistentDb();
  const record = db.users.find((item) => item.id === user.id);
  if (!record) return fail("Akun tidak ditemukan", 404);

  record.passwordHash = await hashPassword(newPassword);
  record.updatedAt = new Date().toISOString();

  // Sesi lain dicabut; sesi yang sedang dipakai tetap aktif.
  const current = await getCurrentSession();
  db.authSessions = db.authSessions.filter(
    (session) => session.userId !== user.id || session.id === current?.id,
  );
  await savePersistentDb(db);

  return ok({ ok: true, revokedOthers: true });
}
