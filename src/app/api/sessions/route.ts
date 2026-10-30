import { NextRequest } from "next/server";
import { DEVICE_TYPES, fail, ok } from "@/lib/api";
import { listSessions, loadDb, saveDb } from "@/lib/store";
import type { DeviceType, Session } from "@/lib/types";


export async function GET(request: NextRequest) {
  const db = loadDb();
  const { searchParams } = request.nextUrl;
  return ok(
    listSessions(db, {
      status: searchParams.get("status") ?? undefined,
      device: searchParams.get("device") ?? undefined,
      query: searchParams.get("query") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 200),
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

  const accountId = String(body.accountId ?? "");
  const deviceType = String(body.deviceType ?? "") as DeviceType;
  const deviceName = String(body.deviceName ?? "").trim();

  const account = db.accounts.find((item) => item.id === accountId);
  if (!account) return fail("Akun tidak ditemukan", 404);
  if (!DEVICE_TYPES.includes(deviceType)) return fail("Tipe perangkat tidak valid");
  if (deviceName.length < 2) return fail("Nama perangkat wajib diisi");
  if (account.status === "suspended") {
    return fail("Akun tersuspend tidak dapat memulai sesi", 409);
  }

  const existing = db.sessions.find(
    (session) => session.accountId === accountId && session.status === "running",
  );
  if (existing) {
    return fail(
      `Akun sedang dipakai di ${existing.deviceName}. Akhiri sesi tersebut terlebih dahulu.`,
      409,
    );
  }

  const now = new Date().toISOString();
  const session: Session = {
    id: `ses_${Date.now().toString(36)}`,
    accountId,
    deviceType,
    deviceName,
    startedAt: now,
    endedAt: null,
    status: "running",
    note: typeof body.note === "string" ? body.note.slice(0, 160) : undefined,
  };

  db.sessions.unshift(session);
  account.status = "active";
  account.lastActiveAt = now;
  account.updatedAt = now;
  saveDb(db);
  return ok({ session }, 201);
}
