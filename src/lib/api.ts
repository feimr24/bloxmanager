import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Guard untuk route API. Mengembalikan response 401 bila belum login,
 * atau null bila sesi valid.
 */
export async function requireApiAuth() {
  const user = await getCurrentUser();
  if (user) return null;
  return NextResponse.json(
    { error: "Sesi berakhir. Silakan masuk kembali.", code: "UNAUTHORIZED" },
    { status: 401 },
  );
}

export function parseBody<T>(body: unknown): T {
  return body as T;
}

export const ACCOUNT_STATUSES = ["active", "available", "suspended"] as const;
export const DEVICE_TYPES = ["pc", "handphone", "redfingers"] as const;
