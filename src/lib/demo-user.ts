import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_USERNAME } from "./demo-credentials";
import { hashPasswordSync } from "./password";
import type { User } from "./types";

export { DEMO_EMAIL, DEMO_PASSWORD, DEMO_USERNAME };

/** Akun demo terverifikasi agar dashboard bisa langsung dicoba. */
export function createDemoUser(): User {
  const now = new Date().toISOString();
  return {
    id: "usr_demo_admin",
    email: DEMO_EMAIL,
    username: DEMO_USERNAME,
    passwordHash: hashPasswordSync(DEMO_PASSWORD),
    createdAt: now,
    updatedAt: now,
  };
}
