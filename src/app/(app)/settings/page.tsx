import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";
import { getCurrentSession, listUserSessions, requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Kelola profil, password, dan sesi akun BLOX MANAGER.",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const current = await getCurrentSession();
  const sessions = (await listUserSessions(user.id)).map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    userAgent: session.userAgent ?? null,
    ip: session.ip ?? null,
    current: session.id === current?.id,
  }));

  return (
    <SettingsView
      user={{
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ?? null,
      }}
      sessions={sessions}
    />
  );
}
