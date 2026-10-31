import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { validateUsername } from "@/lib/auth-validation";
import { loadDb, saveDb } from "@/lib/store";

export async function PATCH(request: NextRequest) {
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

  const username = String(body.username ?? "").trim();
  const usernameError = validateUsername(username);
  if (usernameError) return fail(usernameError);

  const db = loadDb();
  const taken = db.users.some(
    (item) => item.id !== user.id && item.username.toLowerCase() === username.toLowerCase(),
  );
  if (taken) return fail("Username sudah dipakai. Pilih username lain.", 409);

  const record = db.users.find((item) => item.id === user.id);
  if (!record) return fail("Akun tidak ditemukan", 404);

  record.username = username;
  record.updatedAt = new Date().toISOString();
  saveDb(db);

  return ok({
    ok: true,
    user: { username: record.username, email: record.email },
  });
}
