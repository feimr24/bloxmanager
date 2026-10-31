import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api";
import { buildOverview, loadPersistentDb } from "@/lib/store";


export async function GET() {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const db = await loadPersistentDb();
  return NextResponse.json(buildOverview(db));
}
