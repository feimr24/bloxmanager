"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { SessionRow } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { DEVICE_LABEL, formatDuration, formatTime } from "@/lib/utils";

const deviceColor: Record<string, string> = {
  pc: "text-accent bg-brand/10 border-brand/20",
  handphone: "text-info bg-info/10 border-info/20",
  redfingers: "text-violet bg-violet/10 border-violet/20",
};

export function RecentSessions({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div className="card-surface panel-glow animate-in-up flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-[13.5px] font-semibold text-strong">Aktivitas Terbaru</h2>
          <p className="mt-0.5 text-[11px] text-muted">Sesi yang baru dimulai di seluruh perangkat</p>
        </div>
        <Link
          href="/activity"
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-body transition hover:border-line-strong hover:text-strong"
        >
          Semua <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="no-scrollbar flex-1 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line/70 text-[9.5px] uppercase tracking-[0.12em] text-faint">
              <th className="px-4 py-2.5 font-medium sm:px-5">Akun</th>
              <th className="px-3 py-2.5 font-medium">Perangkat</th>
              <th className="px-3 py-2.5 font-medium">Mulai</th>
              <th className="px-3 py-2.5 font-medium">Durasi</th>
              <th className="px-4 py-2.5 text-right font-medium sm:px-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="group border-b border-line/50 transition last:border-0 hover:bg-hover">
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={session.username} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-body">{session.username}</p>
                      <p className="text-[9.5px] text-faint">{session.id.toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${deviceColor[session.deviceType]}`}>
                    {DEVICE_LABEL[session.deviceType]}
                  </span>
                  <p className="mt-1 truncate text-[9.5px] text-faint">{session.deviceName}</p>
                </td>
                <td className="px-3 py-3">
                  <span className="tabular text-[11.5px] text-body">{formatTime(session.startedAt)}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="tabular inline-flex items-center gap-1 text-[11px] text-muted">
                    <Clock3 className="size-3 text-faint" />
                    {formatDuration(session.startedAt, session.endedAt)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right sm:px-5">
                  <StatusBadge status={session.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
