import { NextRequest } from "next/server";
import { DEVICE_TYPES, fail, ok, requireApiAuth } from "@/lib/api";
import { groupRows, loadPersistentDb, savePersistentDb } from "@/lib/store";
import type { DeviceType, Group } from "@/lib/types";


export async function GET() {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const db = await loadPersistentDb();
  return ok({ groups: groupRows(db) });
}

export async function POST(request: NextRequest) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const db = await loadPersistentDb();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const deviceType = String(body.deviceType ?? "pc") as DeviceType;

  if (name.length < 3 || name.length > 40) return fail("Nama grup harus 3–40 karakter");
  if (!DEVICE_TYPES.includes(deviceType)) return fail("Tipe perangkat tidak valid");
  if (db.groups.some((group) => group.name.toLowerCase() === name.toLowerCase())) {
    return fail("Nama grup sudah digunakan", 409);
  }

  const group: Group = {
    id: `grp_${Date.now().toString(36)}`,
    name,
    description: description || "Belum ada deskripsi.",
    deviceType,
    memberIds: [],
    createdAt: new Date().toISOString(),
  };
  db.groups.push(group);
  await savePersistentDb(db);
  return ok({ group }, 201);
}
