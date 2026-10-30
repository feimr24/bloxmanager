"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cloud,
  Filter,
  Laptop,
  Play,
  Search,
  Smartphone,
  Square,
  Timer,
  XCircle,
  X,
} from "lucide-react";
import type { SessionRow } from "@/lib/types";
import { cn, formatDuration, formatRelative, formatTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { pushToast } from "@/components/ui/toast";
import { StartSessionModal } from "./start-session-modal";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "running", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "failed", label: "Gagal" },
];

const DEVICE_ICON = { pc: Laptop, handphone: Smartphone, redfingers: Cloud };
const DEVICE_LABEL: Record<string, string> = {
  pc: "PC",
  handphone: "Handphone",
  redfingers: "Redfingers",
};

export function ActivityView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ items: SessionRow[]; total: number; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [device, setDevice] = useState("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [startOpen, setStartOpen] = useState(searchParams.get("start") === "1");
  const [endTarget, setEndTarget] = useState<SessionRow | null>(null);
  const [ending, setEnding] = useState(false);
  const [tick, setTick] = useState(0);
  void tick;

  const refresh = useCallback(() => {
    fetch(`/api/sessions?status=${status}&device=${device}&query=${encodeURIComponent(debounced)}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then(setData)
      .catch(() => pushToast("Gagal memuat aktivitas", "error"))
      .finally(() => setLoading(false));
  }, [status, device, debounced]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (searchParams.get("start") === "1") {
      router.replace("/activity");
    }
  }, [searchParams, router]);

  const avgDuration = useMemo(() => {
    const completed = (data?.items ?? []).filter((session) => session.endedAt);
    if (completed.length === 0) return "—";
    const total = completed.reduce(
      (sum, session) =>
        sum + (new Date(session.endedAt as string).getTime() - new Date(session.startedAt).getTime()),
      0,
    );
    const minutes = Math.round(total / completed.length / 60000);
    return `${Math.floor(minutes / 60)}j ${String(minutes % 60).padStart(2, "0")}m`;
  }, [data]);

  async function endSession(outcome: "completed" | "failed") {
    if (!endTarget) return;
    setEnding(true);
    try {
      const response = await fetch(`/api/sessions/${endTarget.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!response.ok) throw new Error();
      pushToast(
        outcome === "completed"
          ? `Sesi ${endTarget.username} diakhiri.`
          : `Sesi ${endTarget.username} ditandai gagal.`,
      );
      setEndTarget(null);
      refresh();
    } catch {
      pushToast("Gagal mengakhiri sesi", "error");
    } finally {
      setEnding(false);
    }
  }

  const counts = data?.counts ?? { running: 0, completed: 0, failed: 0 };
  const stats = [
    { label: "Sesi berjalan", value: String(counts.running), icon: Play, tone: "text-success bg-success/10 border-success/20" },
    { label: "Selesai", value: String(counts.completed), icon: CheckCircle2, tone: "text-[#9db9ff] bg-brand/10 border-brand/20" },
    { label: "Gagal / suspend", value: String(counts.failed), icon: XCircle, tone: "text-[#ff8e8e] bg-danger/10 border-danger/20" },
    { label: "Rata-rata durasi", value: avgDuration, icon: Timer, tone: "text-warning bg-warning/10 border-warning/20" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Session Monitor"
        title="Aktivitas"
        description="Lacak akun yang sedang dimainkan dan dari perangkat mana. Hindari multiple login yang memicu suspend."
        actions={
          <Button onClick={() => setStartOpen(true)}>
            <Play className="size-3.5" />
            Mulai Sesi
          </Button>
        }
      />

      <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning/[0.05] px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-[11.5px] leading-relaxed text-warning/90">
          <span className="font-medium text-warning">Peringatan login clash.</span> Satu akun tidak boleh berjalan
          di dua perangkat sekaligus. Sistem akan menolak sesi ganda dan mencatat kejadian pada audit trail.
        </p>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card-surface animate-in-up flex items-center gap-3 p-3.5"
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] border", stat.tone)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] text-faint">{stat.label}</p>
                <p className="tabular mt-0.5 text-[19px] font-semibold leading-none text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-surface panel-glow animate-in-up overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                aria-pressed={status === filter.value}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition",
                  status === filter.value
                    ? "bg-white/[0.07] text-white"
                    : "text-muted hover:bg-white/[0.03] hover:text-slate-200",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-[228px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari username…"
                aria-label="Cari username pada sesi"
                className="h-9 pl-9 pr-8 text-[12px]"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 z-10 size-3.5 -translate-y-1/2 text-faint" />
              <Select
                value={device}
                onChange={(event) => setDevice(event.target.value)}
                aria-label="Filter perangkat"
                className="h-9 pl-8 text-[12px] sm:w-[168px]"
              >
                <option value="all">Semua perangkat</option>
                <option value="pc">PC</option>
                <option value="handphone">Handphone</option>
                <option value="redfingers">Redfingers</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-[#080f1c]/60 text-[9.5px] uppercase tracking-[0.12em] text-faint">
                <th className="px-4 py-2.5 font-medium sm:px-5">Waktu Mulai</th>
                <th className="px-3 py-2.5 font-medium">Username</th>
                <th className="px-3 py-2.5 font-medium">Perangkat</th>
                <th className="px-3 py-2.5 font-medium">Durasi Sesi</th>
                <th className="px-3 py-2.5 font-medium">Status Sesi</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-line/50">
                    <td colSpan={6} className="px-5 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))}
              {data?.items.map((session) => {
                const DeviceIcon = DEVICE_ICON[session.deviceType];
                return (
                  <tr
                    key={session.id}
                    className="border-b border-line/50 transition last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2.5 sm:px-5">
                      <p className="tabular text-[12px] text-slate-200">{formatTime(session.startedAt)}</p>
                      <p className="text-[9.5px] text-faint">{formatRelative(session.startedAt)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={session.username} size="xs" />
                        <div>
                          <p className="text-[12px] font-medium text-slate-200">{session.username}</p>
                          <p className="text-[9.5px] text-faint">{session.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-300">
                        <DeviceIcon className="size-3.5 text-faint" />
                        {DEVICE_LABEL[session.deviceType]}
                      </div>
                      <p className="mt-0.5 text-[9.5px] text-faint">{session.deviceName}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="tabular inline-flex items-center gap-1.5 text-[11.5px] text-slate-300">
                        <Clock3 className="size-3 text-faint" />
                        {formatDuration(session.startedAt, session.endedAt)}
                        {session.status === "running" && (
                          <span className="size-1.5 animate-pulse rounded-full bg-success" />
                        )}
                      </span>
                      {session.note && (
                        <p className="mt-0.5 max-w-[190px] truncate text-[9.5px] text-faint" title={session.note}>
                          {session.note}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right sm:px-5">
                      {session.status === "running" ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setEndTarget(session)}
                          aria-label={`Akhiri sesi ${session.username}`}
                        >
                          <Square className="size-2.5" />
                          Akhiri
                        </Button>
                      ) : (
                        <span className="text-[10.5px] text-faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && data && data.items.length === 0 && (
          <EmptyState
            icon={<Clock3 className="size-5" />}
            title="Belum ada sesi pada filter ini"
            description="Mulai sesi baru atau ubah filter status/perangkat untuk melihat riwayat lain."
            action={
              <Button size="sm" variant="secondary" onClick={() => setStartOpen(true)}>
                <Play className="size-3" /> Mulai sesi
              </Button>
            }
          />
        )}

        {data && data.items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[10.5px] text-faint sm:px-5">
            <span>
              Menampilkan <span className="text-slate-300">{data.items.length}</span> dari{" "}
              <span className="tabular text-slate-300">{data.total}</span> sesi tercatat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Durasi berjalan diperbarui otomatis
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-faint">
        <p>Audit trail mencatat setiap perubahan status dan pembukaan kredensial secara presisi.</p>
        <p className="tabular">Zona waktu: Asia/Jakarta (WIB)</p>
      </div>

      {startOpen && (
        <StartSessionModal
          open={startOpen}
          onClose={() => setStartOpen(false)}
          onStarted={() => {
            setStartOpen(false);
            pushToast("Sesi berhasil dimulai.");
            setStatus("running");
            refresh();
          }}
        />
      )}

      <Modal
        open={Boolean(endTarget)}
        onClose={() => setEndTarget(null)}
        title="Akhiri sesi?"
        description="Durasi final akan dihitung dan status akun kembali menjadi tersedia."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEndTarget(null)} disabled={ending}>
              Batal
            </Button>
            <Button
              variant="secondary"
              onClick={() => endSession("failed")}
              disabled={ending}
              className="text-warning"
            >
              Tandai gagal
            </Button>
            <Button onClick={() => endSession("completed")} loading={ending}>
              <Square className="size-3" />
              Akhiri sesi
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={endTarget?.username ?? ""} size="sm" />
            <div>
              <p className="text-[12.5px] font-medium text-white">{endTarget?.username}</p>
              <p className="text-[10.5px] text-faint">
                {endTarget?.deviceName} · mulai {endTarget ? formatTime(endTarget.startedAt) : ""} ·{" "}
                {endTarget ? formatDuration(endTarget.startedAt) : ""}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
          Setelah sesi berakhir, akun dapat langsung dialokasikan kembali ke perangkat lain.
        </p>
      </Modal>
    </div>
  );
}
