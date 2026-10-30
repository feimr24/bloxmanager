"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import type { TrendPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Segmented } from "@/components/ui/layout";

const W = 1000;
const H = 280;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;

function smoothPath(points: [number, number][]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cx = (x0 + x1) / 2;
    path += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return path;
}

export function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const [days, setDays] = useState<"7" | "30">("7");
  const [hover, setHover] = useState<number | null>(null);

  const visible = useMemo(
    () => (days === "7" ? trend.slice(-7) : trend),
    [trend, days],
  );

  const maxValue = 900;
  const toY = (value: number) =>
    H - PAD_BOTTOM - (value / maxValue) * (H - PAD_TOP - PAD_BOTTOM);
  const toX = (index: number) =>
    visible.length === 1 ? W / 2 : (index / (visible.length - 1)) * W;

  const activePoints = visible.map((point, index) => [toX(index), toY(point.active)] as [number, number]);
  const suspendPoints = visible.map((point, index) => [toX(index), toY(point.suspended)] as [number, number]);
  const activeLine = smoothPath(activePoints);
  const suspendLine = smoothPath(suspendPoints);
  const activeArea = `${activeLine} L${W},${H} L0,${H} Z`;

  const gridValues = [0, 300, 600, 900];
  const activeIndex = hover ?? visible.length - 1;
  const current = visible[activeIndex];
  const last = visible[visible.length - 1];
  const first = visible[0];
  const deltaPercent = first ? ((last.active - first.active) / first.active) * 100 : 0;

  return (
    <div className="card-surface panel-glow animate-in-up flex h-full flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-[#9db9ff]">
              <Activity className="size-3.5" />
            </span>
            <h2 className="text-[14px] font-semibold text-white">Tren Aktivitas Akun</h2>
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted">
            Akun aktif vs tersuspend · {days} hari terakhir
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 text-[10.5px] text-muted sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand" /> Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-danger" /> Tersuspend
            </span>
          </div>
          <Segmented
            ariaLabel="Rentang grafik"
            value={days}
            onChange={setDays}
            options={[
              { value: "7", label: "7H" },
              { value: "30", label: "30H" },
            ]}
          />
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-3">
        <p className="tabular text-[26px] font-semibold tracking-[-0.02em] text-white">
          {formatNumber(current?.active ?? 0)}
        </p>
        <span className="inline-flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-success">
          <ArrowUpRight className="size-3" />
          {deltaPercent.toFixed(1)}%
        </span>
        <span className="text-[10.5px] text-faint">akun aktif pada periode ini</span>
      </div>

      <div className="relative mt-3 flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-8 flex-col justify-between pb-4 pt-1 text-[9.5px] tabular text-faint">
          {[900, 600, 300, 0].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <div
          className="relative ml-9 h-[230px] sm:h-[250px]"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
            setHover(Math.round(ratio * (visible.length - 1)));
          }}
        >
          {hover !== null && current && (
            <div
              className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-lg border border-line-strong bg-[#0b1525]/95 px-2.5 py-1.5 text-[10.5px] shadow-xl backdrop-blur"
              style={{ left: `${(activeIndex / Math.max(visible.length - 1, 1)) * 100}%` }}
            >
              <p className="mb-1 font-medium text-slate-200">
                {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
                  new Date(current.date),
                )}
              </p>
              <p className="flex items-center gap-1.5 text-success">
                <span className="size-1.5 rounded-full bg-success" /> {current.active} aktif
              </p>
              <p className="flex items-center gap-1.5 text-[#ff8e8e]">
                <span className="size-1.5 rounded-full bg-danger" /> {current.suspended} suspend
              </p>
            </div>
          )}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={`Grafik tren ${days} hari: ${last?.active} akun aktif dan ${last?.suspended} tersuspend`}
          >
            <defs>
              <linearGradient id="activeArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.30" />
                <stop offset="70%" stopColor="#5b8cff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#5b8cff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="activeStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4a78f8" />
                <stop offset="100%" stopColor="#8fb0ff" />
              </linearGradient>
            </defs>

            {gridValues.map((value) => (
              <line
                key={value}
                x1="0"
                x2={W}
                y1={toY(value)}
                y2={toY(value)}
                stroke="#1a2539"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path d={activeArea} fill="url(#activeArea)" />
            <path
              d={activeLine}
              fill="none"
              stroke="url(#activeStroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={suspendLine}
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="1.8"
              strokeDasharray="5 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.9"
            />
            {hover !== null && visible[hover] && (
              <line
                x1={toX(hover)}
                x2={toX(hover)}
                y1={PAD_TOP}
                y2={H}
                stroke="#3a4d6f"
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {visible.map((point, index) => (
            <div
              key={point.date}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(index / Math.max(visible.length - 1, 1)) * 100}%`,
                top: `${(toY(point.active) / H) * 100}%`,
                opacity: hover === index ? 1 : 0,
                transition: "opacity 120ms",
              }}
            >
              <span className="block size-2.5 rounded-full border-2 border-[#0c1424] bg-[#8fb0ff] shadow-[0_0_0_3px_rgba(91,140,255,0.2)]" />
            </div>
          ))}
        </div>

        <div className="ml-9 mt-2 flex justify-between text-[9.5px] text-faint">
          {visible
            .filter((_, index) => (days === "7" ? true : index % 5 === 0 || index === visible.length - 1))
            .map((point) => (
              <span key={point.date}>
                {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
                  new Date(point.date),
                )}
              </span>
            ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
        <div>
          <p className="text-[9.5px] uppercase tracking-wide text-faint">Rata-rata aktif</p>
          <p className="tabular mt-0.5 text-[13px] font-medium text-slate-200">
            {formatNumber(Math.round(visible.reduce((sum, point) => sum + point.active, 0) / visible.length))}
          </p>
        </div>
        <div>
          <p className="text-[9.5px] uppercase tracking-wide text-faint">Puncak suspend</p>
          <p className="tabular mt-0.5 text-[13px] font-medium text-[#ff8e8e]">
            {Math.max(...visible.map((point) => point.suspended))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-wide text-faint">Rasio sehat</p>
          <p className="tabular mt-0.5 text-[13px] font-medium text-success">
            {((last.active / (last.active + last.suspended)) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
