import { NextRequest } from "next/server";
import { ACCOUNT_STATUSES, fail, ok } from "@/lib/api";
import { encryptPassword } from "@/lib/crypto";
import { listAccounts, loadDb, saveDb } from "@/lib/store";
import type { Account, AccountStatus } from "@/lib/types";


export async function GET(request: NextRequest) {
  const db = loadDb();
  const { searchParams } = request.nextUrl;
  return ok(
    listAccounts(db, {
      query: searchParams.get("query") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      groupId: searchParams.get("groupId") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      sort: searchParams.get("sort") ?? undefined,
    }),
  );
}

export async function POST(request: NextRequest) {
  const db = loadDb();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const status = String(body.status ?? "available") as AccountStatus;
  const createdAtRaw = body.createdAt ? String(body.createdAt) : new Date().toISOString();
  const createdAt = new Date(createdAtRaw);

  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
    return fail("Username harus 3–32 karakter (huruf, angka, atau underscore)");
  }
  if (password.length < 4) {
    return fail("Password minimal 4 karakter");
  }
  if (!ACCOUNT_STATUSES.includes(status)) {
    return fail("Status akun tidak valid");
  }
  if (Number.isNaN(createdAt.getTime())) {
    return fail("Tanggal pembuatan tidak valid");
  }
  if (db.accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
    return fail("Username sudah terdaftar", 409);
  }

  const now = new Date().toISOString();
  const account: Account = {
    id: `acc_${Date.now().toString(36)}`,
    username,
    passwordEnc: encryptPassword(password),
    status,
    createdAt: createdAt.toISOString(),
    updatedAt: now,
    suspendedAt: status === "suspended" ? now : undefined,
    lastActiveAt: status === "active" ? now : undefined,
  };

  db.accounts.unshift(account);
  db.audit.unshift({
    id: `aud_${Date.now().toString(36)}`,
    accountId: account.id,
    type: "create",
    message: `Akun ${username} ditambahkan ke master account`,
    at: now,
  });
  saveDb(db);
  return ok({ account: { ...account, passwordEnc: undefined } }, 201);
}
