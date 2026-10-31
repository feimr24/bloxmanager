import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={{ username: user.username, email: user.email }}>{children}</AppShell>
  );
}
