import { NextRequest } from "next/server";
import { ACCOUNT_STATUSES, fail, ok, requireApiAuth } from "@/lib/api";
import { encryptPassword } from "@/lib/crypto";
import { loadDb, saveDb } from "@/lib/store";
import type { AccountStatus } from "@/lib/types";


export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const { id } = await context.params;
  const db = loadDb();
  const account = db.accounts.find((item) => item.id === id);
  if (!account) return fail("Akun tidak ditemukan", 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const now = new Date().toISOString();
  let removedFromGroups: string[] = [];

  if (typeof body.username === "string") {
    const username = body.username.trim();
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      return fail("Username harus 3–32 karakter (huruf, angka, atau underscore)");
    }
    const duplicate = db.accounts.some(
      (item) => item.id !== id && item.username.toLowerCase() === username.toLowerCase(),
    );
    if (duplicate) return fail("Username sudah terdaftar", 409);
    account.username = username;
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 4) return fail("Password minimal 4 karakter");
    account.passwordEnc = encryptPassword(body.password);
  }

  const suspendDays = Math.min(Math.max(Number(body.suspendDays ?? 7) || 7, 1), 90);

  if (typeof body.status === "string") {
    const status = body.status as AccountStatus;
    if (!ACCOUNT_STATUSES.includes(status)) return fail("Status akun tidak valid");
    if (status !== account.status) {
      if (status === "suspended") {
        account.suspendedAt = now;
        account.suspendedUntil = new Date(Date.now() + suspendDays * 86400000).toISOString();

        // Akun tersuspend otomatis keluar dari semua grup.
        const affected = db.groups.filter((group) => group.memberIds.includes(account.id));
        removedFromGroups = affected.map((group) => group.name);
        affected.forEach((group) => {
          group.memberIds = group.memberIds.filter((memberId) => memberId !== account.id);
        });

        db.audit.unshift({
          id: `aud_${Date.now().toString(36)}`,
          accountId: account.id,
          type: "suspend",
          message:
            `Status akun berubah menjadi tersuspend (${suspendDays} hari)` +
            (removedFromGroups.length > 0
              ? ` dan dikeluarkan dari grup ${removedFromGroups.join(", ")}`
              : ""),
          at: now,
        });
      } else {
        account.suspendedAt = undefined;
        account.suspendedUntil = undefined;
      }
      account.status = status;
    } else if (status === "suspended" && body.suspendDays !== undefined) {
      account.suspendedUntil = new Date(Date.now() + suspendDays * 86400000).toISOString();
    }
  }

  if (typeof body.createdAt === "string") {
    const parsed = new Date(body.createdAt);
    if (Number.isNaN(parsed.getTime())) return fail("Tanggal pembuatan tidak valid");
    account.createdAt = parsed.toISOString();
  }

  account.updatedAt = now;
  saveDb(db);
  return ok({
    account: { ...account, passwordEnc: undefined },
    removedFromGroups,
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const { id } = await context.params;
  const db = loadDb();
  const index = db.accounts.findIndex((item) => item.id === id);
  if (index === -1) return fail("Akun tidak ditemukan", 404);

  db.accounts.splice(index, 1);
  db.groups.forEach((group) => {
    group.memberIds = group.memberIds.filter((memberId) => memberId !== id);
  });
  db.sessions = db.sessions.filter((session) => session.accountId !== id);
  saveDb(db);
  return ok({ success: true });
}
