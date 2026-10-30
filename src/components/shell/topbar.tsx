"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Menu,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatRelative } from "@/lib/utils";
import type { OverviewResponse } from "@/lib/types";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/accounts": "Master Account",
  "/activity": "Aktivitas",
  "/groups": "Group",
};

interface AlertItem {
  id: string;
  username: string;
  deviceName: string;
  at: string;
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = TITLES[pathname] ?? "Dashboard";
  const searchRef = useRef<HTMLInputElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());

  useEffect(() => {
    let alive = true;
    fetch("/api/overview")
      .then((response) => response.json())
      .then((data: OverviewResponse) => {
        if (alive) setAlerts(data.alerts);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setNotifyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[#060a12]/85 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 xl:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka menu navigasi"
          className="rounded-lg border border-line p-2 text-slate-300 transition hover:bg-white/[0.06] lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <div className="hidden min-w-0 items-center gap-1.5 text-[12px] text-faint sm:flex">
          <span className="font-medium text-slate-500">Workspace</span>
          <ChevronRight className="size-3" />
          <span className="truncate font-medium text-slate-300">{title}</span>
        </div>

        <form
          className="ml-auto hidden w-full max-w-[300px] md:block"
          onSubmit={(event) => {
            event.preventDefault();
            const value = query.trim();
            router.push(value ? `/accounts?query=${encodeURIComponent(value)}` : "/accounts");
          }}
          role="search"
        >
          <div className="group relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari username…"
              aria-label="Cari username akun"
              className="h-9 w-full rounded-lg border border-line bg-[#0a111d] pl-9 pr-14 text-[12.5px] text-slate-200 placeholder:text-faint transition focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] font-medium text-faint">
              ⌘K
            </kbd>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-3">
          <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-[#0a111d] px-2.5 py-1.5 text-[11px] text-muted xl:flex">
            <CalendarDays className="size-3.5 text-faint" />
            <span suppressHydrationWarning>{today}</span>
          </span>

          <div className="relative" ref={notifyRef}>
            <button
              type="button"
              onClick={() => setNotifyOpen((value) => !value)}
              aria-label="Notifikasi"
              aria-expanded={notifyOpen}
              className={cn(
                "relative rounded-lg border p-2 transition",
                notifyOpen
                  ? "border-line-strong bg-white/[0.06] text-white"
                  : "border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Bell className="size-[17px]" />
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger ring-2 ring-[#060a12]" />
              )}
            </button>

            {notifyOpen && (
              <div className="animate-scale absolute right-0 top-11 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line-strong bg-[#0b1424] shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-[12.5px] font-semibold text-white">Peringatan sistem</p>
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-[#ff8e8e]">
                    {alerts.length} baru
                  </span>
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {alerts.map((alert) => (
                    <li key={alert.id}>
                      <Link
                        href="/accounts?status=suspended"
                        onClick={() => setNotifyOpen(false)}
                        className="flex gap-3 border-b border-line/60 px-4 py-3 transition last:border-0 hover:bg-white/[0.03]"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                          <ShieldAlert className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium text-slate-200">
                            {alert.username} tersuspend
                          </span>
                          <span className="mt-0.5 block text-[11px] text-faint">
                            {alert.deviceName} · {formatRelative(alert.at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl p-0.5 pr-1 transition hover:bg-white/[0.04]"
            aria-label="Menu profil"
          >
            <Avatar name="Faris Alfarizi" size="sm" />
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-[11.5px] font-medium text-slate-200">Faris Alfarizi</span>
              <span className="flex items-center gap-1 text-[9.5px] text-faint">
                <UserRound className="size-2.5" /> Administrator
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
