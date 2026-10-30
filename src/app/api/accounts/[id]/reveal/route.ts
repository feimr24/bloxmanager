import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { decryptPassword } from "@/lib/crypto";
import { loadDb, saveDb } from "@/lib/store";


export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = loadDb();
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
  saveDb(db);

  return ok({ password: decryptPassword(account.passwordEnc), revealedAt: now });
}
