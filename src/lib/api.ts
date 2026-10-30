import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parseBody<T>(body: unknown): T {
  return body as T;
}

export const ACCOUNT_STATUSES = ["active", "available", "suspended"] as const;
export const DEVICE_TYPES = ["pc", "handphone", "redfingers"] as const;
