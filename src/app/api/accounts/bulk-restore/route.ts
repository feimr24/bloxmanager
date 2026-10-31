import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { loadDb, saveDb } from "@/lib/store";

export async function POST(request: NextRequest) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const db = loadDb();
  let body: { accountIds?: unknown; allExpired?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const now = new Date().toISOString();
  const explicit = Array.isArray(body.accountIds)
    ? new Set(body.accountIds.map((id) => String(id)))
    : null;

  const targets = db.accounts.filter((account) => {
    if (explicit) return explicit.has(account.id) && account.status === "suspended";
    return (
      account.status === "suspended" &&
      account.suspendedUntil !== undefined &&
      new Date(account.suspendedUntil).getTime() <= Date.now()
    );
  });

  if (targets.length === 0) return fail("Tidak ada akun tersuspend yang bisa dipulihkan", 404);

  for (const account of targets) {
    account.status = "available";
    account.suspendedAt = undefined;
    account.suspendedUntil = undefined;
    account.updatedAt = now;
  }

  db.audit.unshift({
    id: `aud_${Date.now().toString(36)}`,
    accountId: targets[0].id,
    type: "update",
    message: `${targets.length} akun dipulihkan dari masa suspend`,
    at: now,
  });

  saveDb(db);
  return ok({ restored: targets.map((account) => account.id) });
}
