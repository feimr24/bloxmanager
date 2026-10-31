import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { loadPersistentDb, savePersistentDb } from "@/lib/store";


export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const { id } = await context.params;
  const db = await loadPersistentDb();
  const group = db.groups.find((item) => item.id === id);
  if (!group) return fail("Grup tidak ditemukan", 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 3 || name.length > 40) return fail("Nama grup harus 3–40 karakter");
    const duplicate = db.groups.some(
      (item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return fail("Nama grup sudah digunakan", 409);
    group.name = name;
  }

  if (typeof body.description === "string") {
    group.description = body.description.trim() || "Belum ada deskripsi.";
  }

  if (Array.isArray(body.addAccountIds) && body.addAccountIds.length > 0) {
    const ids = new Set(body.addAccountIds.map((item) => String(item)));
    db.groups.forEach((item) => {
      if (item.id !== group.id) {
        item.memberIds = item.memberIds.filter((memberId) => !ids.has(memberId));
      }
    });
    group.memberIds = Array.from(new Set([...group.memberIds, ...ids]));
  }

  if (Array.isArray(body.removeAccountIds) && body.removeAccountIds.length > 0) {
    const ids = new Set(body.removeAccountIds.map((item) => String(item)));
    group.memberIds = group.memberIds.filter((memberId) => !ids.has(memberId));
  }

  await savePersistentDb(db);
  return ok({ group: { ...group } });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const { id } = await context.params;
  const db = await loadPersistentDb();
  const index = db.groups.findIndex((item) => item.id === id);
  if (index === -1) return fail("Grup tidak ditemukan", 404);
  db.groups.splice(index, 1);
  await savePersistentDb(db);
  return ok({ success: true });
}
