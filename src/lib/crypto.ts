import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Kredensial akun disimpan dengan AES-256-GCM. Kunci diturunkan dari
 * BLOX_SECRET (fallback khusus development) sehingga plaintext tidak pernah
 * ikut tersimpan di database.
 */
const secret = process.env.BLOX_SECRET ?? "blox-manager-development-secret-key";
const key = createHash("sha256").update(secret).digest();

export function encryptPassword(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPassword(payload: string): string {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) {
    throw new Error("Format kredensial tidak dikenali");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
