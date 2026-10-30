"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CircleDashed,
  Download,
  Play,
  RefreshCw,
  ShieldBan,
  Users,
} from "lucide-react";
import type { OverviewResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageHeader, Skeleton } from "@/components/ui/layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DeviceDonut } from "@/components/dashboard/device-donut";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { AlertsCard } from "@/components/dashboard/alerts-card";
import { pushToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetch("/api/overview", { cache: "no-store" });
      if (!response.ok) throw new Error("failed");
      setData(await response.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let alive = true;
    fetch("/api/overview", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("failed");
        return response.json();
      })
      .then((payload: OverviewResponse) => {
        if (!alive) return;
        setData(payload);
        setError(false);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  function exportReport() {
    if (!data) return;
    const rows = [
      ["tanggal", "akun_aktif", "akun_tersuspend"],
      ...data.trend.map((point) => [point.date, point.active, point.suspended]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blox-manager-tren-akun.csv";
    link.click();
    URL.revokeObjectURL(url);
    pushToast("Laporan tren akun berhasil diunduh.");
  }

  if (error) {
    return (
      <div className="card-surface mx-auto mt-10 max-w-md p-8 text-center">
        <p className="text-sm font-medium text-strong">Gagal memuat ringkasan</p>
        <p className="mt-1.5 text-[12.5px] text-muted">Periksa koneksi ke API lalu coba lagi.</p>
        <Button className="mt-4" size="sm" onClick={() => load()}>
          <RefreshCw className="size-3.5" /> Muat ulang
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader
          eyebrow="Command Center"
          title="Ringkasan Operasional"
          description="Pantau kesehatan seluruh akun Roblox, sesi berjalan, dan risiko suspend dalam satu layar."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[142px] rounded-2xl" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Skeleton className="h-[420px] rounded-2xl xl:col-span-8" />
          <Skeleton className="h-[420px] rounded-2xl xl:col-span-4" />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Skeleton className="h-[320px] rounded-2xl xl:col-span-8" />
          <Skeleton className="h-[320px] rounded-2xl xl:col-span-4" />
        </div>
      </div>
    );
  }

  const { stats, trend } = data;
  const activeSpark = trend.slice(-7).map((point) => point.active);
  const suspendSpark = trend.slice(-7).map((point) => point.suspended);
  const totalSpark = trend
    .slice(-7)
    .map((point) => point.active + point.suspended + stats.available);

  return (
    <div>
      <PageHeader
        eyebrow="Command Center"
        title="Ringkasan Operasional"
        description="Pantau kesehatan seluruh akun Roblox, sesi berjalan, dan risiko suspend dalam satu layar."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => load()} disabled={refreshing}>
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
            <Button variant="secondary" size="md" onClick={exportReport}>
              <Download className="size-3.5" />
              Ekspor
            </Button>
            <Link href="/activity?start=1">
              <Button size="md">
                <Play className="size-3.5" />
                Mulai Sesi
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Akun"
          value={stats.total}
          icon={Users}
          tone="brand"
          deltaLabel="Seluruh akun terdaftar"
          spark={totalSpark}
          delay={0}
        />
        <StatCard
          label="Akun Aktif"
          value={stats.active}
          icon={Activity}
          tone="success"
          delta={stats.activeDelta}
          deltaLabel={`vs minggu lalu · ${stats.runningSessions} sesi`}
          spark={activeSpark}
          delay={40}
        />
        <StatCard
          label="Tersedia"
          value={stats.available}
          icon={CircleDashed}
          tone="info"
          deltaLabel="Siap dialokasikan ke grup"
          spark={surge(activeSpark)}
          delay={80}
        />
        <StatCard
          label="Tersuspend"
          value={stats.suspended}
          icon={ShieldBan}
          tone="danger"
          delta={stats.suspendedDelta}
          deltaLabel={`+${stats.suspendedToday} tercatat hari ini`}
          spark={suspendSpark}
          delay={120}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TrendChart trend={trend} />
        </div>
        <div className="xl:col-span-4">
          <DeviceDonut data={data.deviceBreakdown} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RecentSessions sessions={data.recentSessions} />
        </div>
        <div className="flex flex-col gap-3 xl:col-span-4">
          <AlertsCard alerts={data.alerts} />
          <div className="card-surface panel-glow animate-in-up p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[12.5px] font-semibold text-strong">Grup Terbesar</h3>
              <Link
                href="/groups"
                className="inline-flex items-center gap-1 text-[10.5px] font-medium text-accent hover:text-strong"
              >
                Kelola <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {data.topGroups.slice(0, 3).map((group, index) => {
                const width = (group.members / (data.topGroups[0]?.members || 1)) * 100;
                return (
                  <Link href="/groups" key={group.id} className="block rounded-lg p-1 transition hover:bg-hover">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="truncate text-body">
                        <span className="mr-1.5 text-faint">0{index + 1}</span>
                        {group.name}
                      </span>
                      <span className="tabular ml-2 shrink-0 text-muted">{group.members}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-hover-strong">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3b6cf6] to-[#8fb0ff]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function surge(values: number[]) {
  return values.map((value, index) => value - index * 3);
}
