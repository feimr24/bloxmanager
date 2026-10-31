"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { cn, formatRelative } from "@/lib/utils";
import type { AuthUserSummary, OverviewResponse } from "@/lib/types";

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

export function Topbar({
  onOpenMenu,
  user,
}: {
  onOpenMenu: () => void;
  user: AuthUserSummary;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = TITLES[pathname] ?? "Dashboard";
  const searchRef = useRef<HTMLInputElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reopened, setReopened] = useState<OverviewResponse["reopened"]>([]);
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
        if (!alive) return;
        setAlerts(data.alerts);
        setReopened(data.reopened);
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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Tetap arahkan ke halaman masuk meski permintaan gagal.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 xl:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka menu navigasi"
          className="rounded-lg border border-line p-2 text-body transition hover:bg-hover-strong lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <div className="hidden min-w-0 items-center gap-1.5 text-[12px] text-faint sm:flex">
          <span className="font-medium text-faint">Workspace</span>
          <ChevronRight className="size-3" />
          <span className="truncate font-medium text-body">{title}</span>
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
              className="h-9 w-full rounded-lg border border-line bg-field pl-9 pr-14 text-[12.5px] text-body placeholder:text-faint transition focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-hover px-1.5 py-0.5 text-[9.5px] font-medium text-faint">
              ⌘K
            </kbd>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-3">
          <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-field px-2.5 py-1.5 text-[11px] text-muted xl:flex">
            <CalendarDays className="size-3.5 text-faint" />
            <span suppressHydrationWarning>{today}</span>
          </span>

          <ThemeToggle />

          <div className="relative" ref={notifyRef}>
            <button
              type="button"
              onClick={() => setNotifyOpen((value) => !value)}
              aria-label="Notifikasi"
              aria-expanded={notifyOpen}
              className={cn(
                "relative rounded-lg border p-2 transition",
                notifyOpen
                  ? "border-line-strong bg-hover-strong text-strong"
                  : "border-transparent text-muted hover:bg-hover-strong hover:text-strong",
              )}
            >
              <Bell className="size-[17px]" />
              {alerts.length + reopened.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger ring-2 ring-background" />
              )}
            </button>

            {notifyOpen && (
              <div className="animate-scale absolute right-0 top-11 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line-strong bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-[12.5px] font-semibold text-strong">Notifikasi</p>
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                    {alerts.length + reopened.length} baru
                  </span>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {reopened.map((item) => (
                    <li key={item.id}>
                      <Link
                        href="/accounts?status=suspended"
                        onClick={() => setNotifyOpen(false)}
                        className="flex gap-3 border-b border-line/60 px-4 py-3 transition hover:bg-hover"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                          <RotateCcw className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium text-body">
                            {item.username} sudah terbuka
                          </span>
                          <span className="mt-0.5 block text-[11px] text-success">
                            Masa suspend berakhir · siap dipulihkan
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  {alerts.map((alert) => (
                    <li key={alert.id}>
                      <Link
                        href="/accounts?status=suspended"
                        onClick={() => setNotifyOpen(false)}
                        className="flex gap-3 border-b border-line/60 px-4 py-3 transition last:border-0 hover:bg-hover"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                          <ShieldAlert className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium text-body">
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

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-label="Menu profil"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-xl p-0.5 pr-1 transition hover:bg-hover"
            >
              <Avatar name={user.username} size="sm" />
              <span className="hidden text-left leading-tight lg:block">
                <span className="block max-w-[140px] truncate text-[11.5px] font-medium text-body">
                  {user.username}
                </span>
                <span className="flex items-center gap-1 text-[9.5px] text-faint">
                  <UserRound className="size-2.5" /> Administrator
                </span>
              </span>
            </button>

            {profileOpen && (
              <div className="animate-fade absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-line bg-card shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <Avatar name={user.username} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-strong">
                      {user.username}
                    </p>
                    <p className="truncate text-[10.5px] text-faint">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-medium text-danger transition hover:bg-danger/10 disabled:opacity-60"
                >
                  <LogOut className="size-3.5" />
                  {loggingOut ? "Keluar…" : "Keluar dari akun"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
