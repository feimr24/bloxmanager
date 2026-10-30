"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldAlert, TriangleAlert } from "lucide-react";
import type { OverviewResponse } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export function AlertsCard({ alerts }: { alerts: OverviewResponse["alerts"] }) {
  const uniqueDevices = new Set(alerts.map((alert) => alert.deviceName)).size;

  return (
    <div className="card-surface panel-glow animate-in-up flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger">
            <ShieldAlert className="size-3.5" />
          </span>
          <h2 className="text-[13.5px] font-semibold text-white">Peringatan Suspend</h2>
        </div>
        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-[#ff8e8e]">
          {alerts.length} kejadian
        </span>
      </div>

      <div className="flex-1 divide-y divide-line/70">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-2.5 px-4 py-3 sm:px-5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-danger" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-slate-200">
                {alert.username}
                <span className="ml-1.5 font-normal text-faint">· {alert.deviceName}</span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-relaxed text-faint">
                {alert.message}
              </p>
              <p className="mt-1 text-[9.5px] text-[#ff8e8e]/80">{formatRelative(alert.at)}</p>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="px-5 py-6 text-center text-[11.5px] text-faint">
            Tidak ada suspend dalam 24 jam terakhir.
          </div>
        )}
      </div>

      <div className="border-t border-line bg-danger/[0.03] px-4 py-3 sm:px-5">
        <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-[#ffb3b3]/80">
          <TriangleAlert className="mt-0.5 size-3 shrink-0" />
          Pola serentak terdeteksi di {uniqueDevices} perangkat. Audit trail mencatat timestamp presisi.
        </p>
        <Link
          href="/accounts?status=suspended"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#9db9ff] transition hover:text-white"
        >
          Tinjau akun tersuspend <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
