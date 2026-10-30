"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const NAV = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/accounts", label: "Master Account", icon: Users },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/activity", label: "Aktivitas", icon: Activity, badge: "42" },
      { href: "/groups", label: "Group", icon: FolderKanban },
    ],
  },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onClose}
          className="animate-fade fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-[#070d18]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigasi utama"
      >
        <div className="flex h-[68px] items-center justify-between border-b border-line px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6b98ff] to-[#3b6cf6] shadow-[0_8px_20px_-8px_rgba(59,108,246,0.9)]">
              <Boxes className="size-[18px] text-white" strokeWidth={2.2} />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-semibold tracking-[0.08em] text-white">BLOX</span>
              <span className="mt-1 block text-[9.5px] font-medium tracking-[0.22em] text-faint">
                MANAGER
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-1.5 text-faint hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3 pt-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#16223a] text-[10px] font-semibold text-[#9db9ff]">
              OP
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-slate-200">Roblox Division</p>
              <p className="text-[10px] text-faint">Operational workspace</p>
            </div>
            <ChevronRight className="size-3.5 text-faint" />
          </div>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
          {NAV.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-faint/80">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                          active
                            ? "bg-gradient-to-r from-brand/15 to-transparent text-white"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                        )}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 left-0 w-[2.5px] rounded-full bg-brand" />
                        )}
                        <Icon
                          className={cn(
                            "size-[17px] transition",
                            active ? "text-[#8fb0ff]" : "text-faint group-hover:text-slate-300",
                          )}
                          strokeWidth={1.9}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#9db9ff]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="mb-2 px-3 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-faint/80">
            Sistem
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 opacity-60"
            >
              <ShieldCheck className="size-[17px]" strokeWidth={1.9} />
              Audit Trail
              <span className="ml-auto rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                soon
              </span>
            </button>
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 opacity-60"
            >
              <Settings2 className="size-[17px]" strokeWidth={1.9} />
              Pengaturan
            </button>
          </div>
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <div className="rounded-xl border border-success/15 bg-success/[0.06] p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <p className="text-[11.5px] font-medium text-emerald-100">Sistem operasional</p>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] leading-relaxed text-emerald-200/60">
              <LockKeyhole className="size-3" />
              AES-256 · kredensial terenkripsi
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
            <Avatar name="Faris Alfarizi" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-slate-200">Faris Alfarizi</p>
              <p className="text-[10px] text-faint">Administrator</p>
            </div>
            <Settings2 className="size-3.5 text-faint" />
          </div>
        </div>
      </aside>
    </>
  );
}
