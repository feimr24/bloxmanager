import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { clearSessionCookie, getCurrentSession, getCurrentUser, listUserSessions } from "@/lib/auth";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";

export async function POST(request: NextRequest) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return fail("Sesi berakhir. Silakan masuk kembali.", 401);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const scope = String(body.scope ?? "");
  const sessionId = String(body.sessionId ?? "");
  const db = await loadPersistentDb();
  const current = await getCurrentSession();

  if (scope === "all") {
    db.authSessions = db.authSessions.filter((session) => session.userId !== user.id);
    await savePersistentDb(db);
    await clearSessionCookie();
    return ok({ ok: true, loggedOut: true, revoked: "all" });
  }

  if (scope === "others" || (scope === "" && !sessionId)) {
    const before = db.authSessions.length;
    db.authSessions = db.authSessions.filter(
      (session) => session.userId !== user.id || session.id === current?.id,
    );
    await savePersistentDb(db);
    return ok({ ok: true, revoked: before - db.authSessions.length });
  }

  if (sessionId) {
    const target = db.authSessions.find(
      (session) => session.id === sessionId && session.userId === user.id,
    );
    if (!target) return fail("Sesi tidak ditemukan", 404);

    db.authSessions = db.authSessions.filter((session) => session.id !== sessionId);
    await savePersistentDb(db);

    const wasCurrent = target.id === current?.id;
    if (wasCurrent) await clearSessionCookie();
    return ok({ ok: true, loggedOut: wasCurrent, revoked: 1 });
  }

  return fail("Permintaan tidak valid");
}

export async function GET() {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return fail("Sesi berakhir. Silakan masuk kembali.", 401);

  const current = await getCurrentSession();
  const sessions = (await listUserSessions(user.id)).map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    userAgent: session.userAgent ?? null,
    ip: session.ip ?? null,
    current: session.id === current?.id,
  }));

  return ok({ sessions });
}
