"use client";

import { Laptop, Smartphone, Cloud, MoreHorizontal } from "lucide-react";
import type { DeviceType } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const DEVICE_META: Record<DeviceType, { label: string; color: string; icon: typeof Laptop }> = {
  pc: { label: "PC / Rig", color: "#5b8cff", icon: Laptop },
  handphone: { label: "Handphone", color: "#58c7f3", icon: Smartphone },
  redfingers: { label: "Redfingers", color: "#a78bfa", icon: Cloud },
};

export function DeviceDonut({
  data,
}: {
  data: { deviceType: DeviceType; sessions: number; running: number; accounts: number }[];
}) {
  const totalAccounts = data.reduce((sum, item) => sum + item.accounts, 0) || 1;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offsets = data.map((_, index) =>
    data.slice(0, index).reduce((sum, item) => sum + item.accounts, 0),
  );

  return (
    <div className="card-surface panel-glow animate-in-up flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-white">Alokasi Perangkat</h2>
          <p className="mt-1 text-[11.5px] text-muted">Sebaran akun per environment</p>
        </div>
        <button
          type="button"
          aria-label="Opsi alokasi perangkat"
          className="rounded-lg p-1.5 text-faint transition hover:bg-white/[0.06] hover:text-white"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-[146px] shrink-0">
          <svg viewBox="0 0 140 140" className="size-full -rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#16223a" strokeWidth="12" />
            {data.map((item, index) => {
              const meta = DEVICE_META[item.deviceType];
              const length = (item.accounts / totalAccounts) * circumference;
              const dash = `${Math.max(length - 1.5, 0)} ${circumference - Math.max(length - 1.5, 0)}`;
              return (
                <circle
                  key={item.deviceType}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="12"
                  strokeDasharray={dash}
                  strokeDashoffset={-(offsets[index] / totalAccounts) * circumference}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-[24px] font-semibold leading-none tracking-[-0.02em] text-white">
              {formatNumber(totalAccounts)}
            </span>
            <span className="mt-1 text-[9.5px] uppercase tracking-[0.12em] text-faint">Teralokasi</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {data.map((item) => {
            const meta = DEVICE_META[item.deviceType];
            const Icon = meta.icon;
            const percent = (item.accounts / totalAccounts) * 100;
            return (
              <div key={item.deviceType} className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0" style={{ color: meta.color }} />
                  <span className="truncate text-[11.5px] text-slate-300">{meta.label}</span>
                  <span className="tabular ml-auto text-[11px] font-medium text-slate-200">
                    {percent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, background: meta.color }}
                  />
                </div>
                <p className="mt-1 text-[9.5px] text-faint">
                  {formatNumber(item.accounts)} akun · {item.running} sesi aktif
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl border border-line bg-white/[0.02] p-2.5">
        <p className="mb-1.5 text-[9.5px] uppercase tracking-[0.12em] text-faint">Status environment</p>
        {data.map((item) => {
          const meta = DEVICE_META[item.deviceType];
          const warn = item.deviceType === "redfingers";
          return (
            <div key={item.deviceType} className="flex items-center justify-between text-[10.5px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
              <span className={warn ? "text-warning" : "text-success"}>
                {warn ? "Waspada suspend" : "Normal"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3 mt-4">
        <p className="text-[10.5px] text-faint">Kapasitas terpakai</p>
        <p className="text-[10.5px] font-medium text-warning">72% dari 1.700 slot</p>
      </div>
    </div>
  );
}
