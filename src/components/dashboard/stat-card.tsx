"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

const tones = {
  brand: { text: "text-[#9db9ff]", bg: "bg-brand/10", ring: "border-brand/20", stroke: "#5b8cff" },
  success: { text: "text-success", bg: "bg-success/10", ring: "border-success/20", stroke: "#3ddc97" },
  info: { text: "text-info", bg: "bg-info/10", ring: "border-info/20", stroke: "#58c7f3" },
  danger: { text: "text-danger", bg: "bg-danger/10", ring: "border-danger/20", stroke: "#ff6b6b" },
} as const;

type Tone = keyof typeof tones;

function sparkPath(values: number[], width = 96, height = 40) {
  if (values.length < 2) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 4 - ((value - min) / range) * (height - 8);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  delta,
  deltaLabel,
  spark,
  footer,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  delta?: number;
  deltaLabel?: string;
  spark?: number[];
  footer?: string;
  delay?: number;
}) {
  const palette = tones[tone];
  const positive = (delta ?? 0) >= 0;
  const sparkData = sparkPath(spark ?? []);

  return (
    <div
      className="card-surface panel-glow animate-in-up group relative overflow-hidden p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 size-32 rounded-full opacity-[0.12] blur-2xl transition group-hover:opacity-20"
        style={{ background: palette.stroke }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium tracking-wide text-muted">{label}</p>
          <p className="tabular mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">
            {formatNumber(value)}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px] border",
            palette.bg,
            palette.ring,
            palette.text,
          )}
        >
          <Icon className="size-[17px]" strokeWidth={1.9} />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {typeof delta === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold",
                positive ? "bg-success/10 text-success" : "bg-danger/10 text-[#ff8e8e]",
              )}
            >
              {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {positive ? "+" : ""}
              {delta}
            </span>
          )}
          <p className="mt-1.5 truncate text-[10.5px] text-faint">{deltaLabel ?? footer}</p>        </div>
        {spark && spark.length > 1 && (
          <svg width="96" height="40" viewBox="0 0 96 40" className="shrink-0" aria-hidden>
            <defs>
              <linearGradient id={`spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.stroke} stopOpacity="0.28" />
                <stop offset="100%" stopColor={palette.stroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkData.area} fill={`url(#spark-${label.replace(/\s/g, "")})`} />
            <path
              d={sparkData.line}
              fill="none"
              stroke={palette.stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
