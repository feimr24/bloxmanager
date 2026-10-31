import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const PREFIX = "scrypt";

function encode(salt: string, hash: Buffer) {
  return `${PREFIX}:${salt}:${hash.toString("hex")}`;
}

/** Dipakai untuk seed/migrasi yang berjalan sinkron. */
export function hashPasswordSync(password: string) {
  const salt = randomBytes(16).toString("hex");
  return encode(salt, scryptSync(password, salt, KEY_LENGTH));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return encode(salt, hash);
}

export async function verifyPassword(password: string, stored: string) {
  const [prefix, salt, hash] = stored.split(":");
  if (prefix !== PREFIX || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (expected.length === 0) return false;

  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(expected, actual);
}
