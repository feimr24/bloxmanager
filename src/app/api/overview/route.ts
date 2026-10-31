import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api";
import { buildOverview, loadDb } from "@/lib/store";


export async function GET() {
  const denied = await requireApiAuth();
  if (denied) return denied;

  const db = loadDb();
  return NextResponse.json(buildOverview(db));
}
