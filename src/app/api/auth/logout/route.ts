import { ok } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/auth";

export async function POST() {
  await destroyCurrentSession();
  return ok({ ok: true });
}
