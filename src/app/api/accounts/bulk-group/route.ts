import { NextRequest } from "next/server";
import { fail, ok, requireApiAuth } from "@/lib/api";
import { loadDb, saveDb } from "@/lib/store";


export async function POST(request: NextRequest) {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const db = loadDb();
  let body: { accountIds?: unknown; groupId?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const groupId = String(body.groupId ?? "");
  const accountIds = Array.isArray(body.accountIds)
    ? body.accountIds.map((id) => String(id))
    : [];
  const group = db.groups.find((item) => item.id === groupId);
  if (!group) return fail("Grup tidak ditemukan", 404);
  if (accountIds.length === 0) return fail("Pilih minimal satu akun");

  const validIds = accountIds.filter((id) =>
    db.accounts.some((account) => account.id === id),
  );

  // Satu akun hanya boleh berada dalam satu grup agar alokasi perangkat jelas.
  db.groups.forEach((item) => {
    if (item.id !== group.id) {
      item.memberIds = item.memberIds.filter((id) => !validIds.includes(id));
    }
  });
  const merged = new Set([...group.memberIds, ...validIds]);
  group.memberIds = Array.from(merged);

  const now = new Date().toISOString();
  db.audit.unshift({
    id: `aud_${Date.now().toString(36)}`,
    accountId: validIds[0] ?? "",
    type: "update",
    message: `${validIds.length} akun dipindahkan ke grup ${group.name}`,
    at: now,
  });

  saveDb(db);
  return ok({ groupId: group.id, added: validIds.length, total: group.memberIds.length });
}
