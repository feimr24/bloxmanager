import { NextResponse } from "next/server";
import { buildOverview, loadDb } from "@/lib/store";


export async function GET() {
  const db = loadDb();
  return NextResponse.json(buildOverview(db));
}
