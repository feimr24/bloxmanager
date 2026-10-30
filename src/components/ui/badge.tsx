import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "info" | "danger" | "warning" | "neutral" | "brand";

const tones: Record<BadgeTone, string> = {
  success: "border-success/25 bg-success/10 text-success",
  info: "border-info/25 bg-info/10 text-info",
  danger: "border-danger/25 bg-danger/10 text-danger",
  warning: "border-warning/25 bg-warning/10 text-warning",
  neutral: "border-line-strong bg-hover text-muted",
  brand: "border-brand/25 bg-brand/10 text-accent",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const statusTone: Record<string, BadgeTone> = {
  active: "success",
  running: "success",
  available: "info",
  completed: "neutral",
  suspended: "danger",
  failed: "danger",
};

const statusLabel: Record<string, string> = {
  active: "Aktif",
  running: "Berjalan",
  available: "Tersedia",
  completed: "Selesai",
  suspended: "Tersuspend",
  failed: "Gagal",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone[status] ?? "neutral"} dot className={className}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}
