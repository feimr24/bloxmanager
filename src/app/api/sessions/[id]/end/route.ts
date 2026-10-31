import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const { id } = await context.params;
  const db = await loadPersistentDb();
  const session = db.sessions.find((item) => item.id === id);
  if (!session) return fail("Sesi tidak ditemukan", 404);
  if (session.status !== "running") return fail("Sesi ini sudah berakhir", 409);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const now = new Date().toISOString();
  const failed = body.outcome === "failed";
  session.status = failed ? "failed" : "completed";
  session.endedAt = now;

  const account = db.accounts.find((item) => item.id === session.accountId);
  if (account) {
    account.updatedAt = now;
    account.lastActiveAt = now;
    const stillRunning = db.sessions.some(
      (item) => item.accountId === account.id && item.status === "running" && item.id !== session.id,
    );
    if (!stillRunning && account.status === "active") {
      account.status = "available";
    }
  }

  await savePersistentDb(db);
  return ok({ session });
}
