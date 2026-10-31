"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Toaster } from "@/components/ui/toast";
import type { AuthUserSummary } from "@/lib/types";

export function AppShell({ children, user }: { children: ReactNode; user: AuthUserSummary }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <Topbar onOpenMenu={() => setMenuOpen(true)} user={user} />
        <main className="mx-auto w-full max-w-[1640px] flex-1 px-4 pb-12 pt-6 sm:px-6 xl:px-8">
          {children}
        </main>
        <footer className="border-t border-line/60 px-4 py-4 text-[10.5px] text-faint sm:px-6 xl:px-8">
          <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-2">
            <span>© 2026 BLOX MANAGER · Internal account operations</span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />
              API normal · enkripsi AES-256-GCM
            </span>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
