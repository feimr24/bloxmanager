import { NextRequest } from "next/server";
import { ACCOUNT_STATUSES, fail, ok } from "@/lib/api";
import { encryptPassword } from "@/lib/crypto";
import { loadDb, saveDb } from "@/lib/store";
import type { Account, AccountStatus } from "@/lib/types";

export async function POST(request: NextRequest) {
  const db = loadDb();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const rawUsernames = Array.isArray(body.usernames)
    ? body.usernames.map((item) => String(item))
    : String(body.usernames ?? "").split(/[\n,]+/);

  const usernames = Array.from(
    new Set(rawUsernames.map((item) => item.trim()).filter(Boolean)),
  );

  const password = String(body.password ?? "");
  const status = String(body.status ?? "available") as AccountStatus;
  const suspendDays = Math.min(Math.max(Number(body.suspendDays ?? 7) || 7, 1), 90);
  const createdAtRaw = body.createdAt ? String(body.createdAt) : new Date().toISOString();
  const createdAt = new Date(createdAtRaw);

  if (usernames.length === 0) return fail("Minimal satu username diperlukan");
  if (usernames.length > 200) return fail("Maksimal 200 akun sekali tambah");
  if (password.length < 4) return fail("Password minimal 4 karakter");
  if (!ACCOUNT_STATUSES.includes(status)) return fail("Status akun tidak valid");
  if (Number.isNaN(createdAt.getTime())) return fail("Tanggal pembuatan tidak valid");

  const now = new Date().toISOString();
  const existing = new Set(db.accounts.map((account) => account.username.toLowerCase()));
  const created: { id: string; username: string }[] = [];
  const skipped: { username: string; reason: string }[] = [];

  for (const username of usernames) {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      skipped.push({ username, reason: "Format username tidak valid" });
      continue;
    }
    if (existing.has(username.toLowerCase())) {
      skipped.push({ username, reason: "Username sudah terdaftar" });
      continue;
    }

    const account: Account = {
      id: `acc_${Date.now().toString(36)}${created.length}`,
      username,
      passwordEnc: encryptPassword(password),
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: now,
      suspendedAt: status === "suspended" ? now : undefined,
      suspendedUntil:
        status === "suspended"
          ? new Date(Date.now() + suspendDays * 86400000).toISOString()
          : undefined,
      lastActiveAt: status === "active" ? now : undefined,
    };

    db.accounts.unshift(account);
    existing.add(username.toLowerCase());
    created.push({ id: account.id, username: account.username });
  }

  if (created.length > 0) {
    db.audit.unshift({
      id: `aud_${Date.now().toString(36)}`,
      accountId: created[0].id,
      type: "create",
      message: `${created.length} akun ditambahkan sekaligus (password sama)`,
      at: now,
    });
    saveDb(db);
  }

  return ok({ created, skipped }, 201);
}
