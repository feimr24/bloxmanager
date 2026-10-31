import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { decryptPassword } from "@/lib/crypto";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";


export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const { id } = await context.params;
  const db = await loadPersistentDb();
  const account = db.accounts.find((item) => item.id === id);
  if (!account) return fail("Akun tidak ditemukan", 404);

  const now = new Date().toISOString();
  db.audit.unshift({
    id: `aud_${Date.now().toString(36)}`,
    accountId: account.id,
    type: "reveal",
    message: `Password akun ${account.username} dibuka oleh administrator`,
    at: now,
  });
  await savePersistentDb(db);

  return ok({ password: decryptPassword(account.passwordEnc), revealedAt: now });
}
