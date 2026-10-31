import Link from "next/link";
import type { ReactNode } from "react";
import { Boxes, LockKeyhole } from "lucide-react";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-48 size-[560px] rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -left-40 size-[480px] rounded-full bg-success/10 blur-3xl"
      />

      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/login" className="flex items-center gap-2.5" aria-label="BLOX MANAGER">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6b98ff] to-[#3b6cf6] shadow-[0_8px_22px_-10px_rgba(59,108,246,0.9)]">
            <Boxes className="size-[19px] text-white" strokeWidth={2.2} />
          </span>
          <span className="leading-none">
            <span className="block text-[15px] font-semibold tracking-[0.08em] text-strong">
              BLOX
            </span>
            <span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.34em] text-faint">
              Manager
            </span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      <footer className="relative px-5 pb-6 text-center text-[10.5px] text-faint sm:px-8">
        <p className="flex items-center justify-center gap-1.5">
          <LockKeyhole className="size-3" />
          Sesi terenkripsi · kredensial akun dienkripsi AES-256-GCM
        </p>
        <p className="mt-1.5">© 2026 BLOX MANAGER · Internal account operations</p>
      </footer>
    </div>
  );
}
