"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  FolderPlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { AccountRow, AccountStatus, GroupRow } from "@/lib/types";
import {
  cn,
  formatCountdown,
  formatDate,
  formatNumber,
  formatSuspendAge,
} from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select } from "@/components/ui/input";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { pushToast } from "@/components/ui/toast";
import { AccountFormModal } from "./account-form";

interface AccountsResponse {
  items: AccountRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<AccountStatus, number>;
  reopened: { id: string; username: string; suspendedUntil: string }[];
}

const PAGE_SIZE = 20;

const STATUS_TABS: { value: string; label: string; key: AccountStatus | "all" }[] = [
  { value: "all", label: "Semua", key: "all" },
  { value: "active", label: "Aktif", key: "active" },
  { value: "available", label: "Tersedia", key: "available" },
  { value: "suspended", label: "Tersuspend", key: "suspended" },
];

export function AccountsView() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [debounced, setDebounced] = useState(query);
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [assignGroup, setAssignGroup] = useState("");
  const [assigning, setAssigning] = useState(false);

  function formatAccountAge(createdAt: string) {
    const start = new Date(createdAt);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const days = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
    if (days === 0) return "Hari ini";
    if (days === 1) return "1 hari";
    return `${formatNumber(days)} hari`;
  }

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  void tick;

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const isReopened = useCallback(
    (account: AccountRow) =>
      account.status === "suspended" &&
      Boolean(account.suspendedUntil) &&
      new Date(account.suspendedUntil as string).getTime() <= Date.now(),
    [],
  );

  async function restore(ids?: string[]) {
    setRestoring(true);
    try {
      const response = await fetch("/api/accounts/bulk-restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { accountIds: ids } : {}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      pushToast(
        `${ids?.length ?? payload.restored.length} akun dipulihkan dan kembali tersedia.`,
      );
      refresh();
    } catch {
      pushToast("Gagal memulihkan akun", "error");
    } finally {
      setRestoring(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({
      query: debounced,
      status,
      sort,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    fetch(`/api/accounts?${params.toString()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: AccountsResponse) => {
        if (!alive) return;
        setData(payload);
        setSelected(new Set());
      })
      .catch(() => pushToast("Gagal memuat daftar akun", "error"))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced, status, sort, page, refreshKey]);

  useEffect(() => {
    fetch("/api/groups", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { groups: GroupRow[] }) => {
        setGroups(payload.groups);
        setAssignGroup(payload.groups[0]?.id ?? "");
      })
      .catch(() => undefined);
  }, [refreshKey]);

  async function reveal(account: AccountRow) {
    if (revealed[account.id]) {
      setRevealed((current) => {
        const next = { ...current };
        delete next[account.id];
        return next;
      });
      return;
    }
    setRevealing(account.id);
    try {
      const response = await fetch(`/api/accounts/${account.id}/reveal`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setRevealed((current) => ({ ...current, [account.id]: payload.password }));
      pushToast("Password dibuka. Tindakan tercatat di audit trail.", "info");
    } catch {
      pushToast("Password gagal dibuka", "error");
    } finally {
      setRevealing(null);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/accounts/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      pushToast(`Akun ${deleteTarget.username} dihapus.`);
      setDeleteTarget(null);
      refresh();
    } catch {
      pushToast("Gagal menghapus akun", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function assign() {
    if (!assignGroup || selected.size === 0) return;
    setAssigning(true);
    try {
      const response = await fetch("/api/accounts/bulk-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: assignGroup, accountIds: Array.from(selected) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const groupName = groups.find((group) => group.id === assignGroup)?.name ?? "grup";
      pushToast(`${payload.added} akun dipindahkan ke ${groupName}.`);
      setAssignOpen(false);
      setSelected(new Set());
      refresh();
    } catch {
      pushToast("Gagal memindahkan akun", "error");
    } finally {
      setAssigning(false);
    }
  }

  const suspendedView = status === "suspended";
  const allSelected = data ? data.items.length > 0 && data.items.every((item) => selected.has(item.id)) : false;
  const counts = data?.counts;
  const tabs = STATUS_TABS.map((tab) => ({
    ...tab,
    count: tab.key === "all" ? (counts ? counts.active + counts.available + counts.suspended : 0) : (counts?.[tab.key] ?? 0),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Master Database"
        title="Master Account"
        description="Sumber kebenaran tunggal untuk seluruh akun Roblox. Password disensor secara default dan dienkripsi di penyimpanan."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" />
            Tambah Akun
          </Button>
        }
      />

      {data && data.reopened.length > 0 && (
        <div className="animate-in-up mb-3 flex flex-col gap-3 rounded-xl border border-success/30 bg-success/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-success/25 bg-success/10 text-success">
              <RotateCcw className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-strong">
                {data.reopened.length} akun sudah melewati masa suspend
              </p>
              <p className="mt-0.5 truncate text-[10.5px] text-muted">
                Siap dipulihkan: {data.reopened.slice(0, 4).map((item) => item.username).join(", ")}
                {data.reopened.length > 4 ? `, +${data.reopened.length - 4} lainnya` : ""}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={() => restore()}
            loading={restoring}
          >
            <RotateCcw className="size-3.5" />
            Pulihkan semua
          </Button>
        </div>
      )}

      <div className="card-surface panel-glow animate-in-up overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                aria-pressed={status === tab.value}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition",
                  status === tab.value
                    ? "bg-hover-strong text-strong"
                    : "text-muted hover:bg-hover hover:text-strong",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "tabular rounded px-1.5 py-0.5 text-[9.5px] font-semibold",
                    status === tab.value ? "bg-brand/20 text-accent" : "bg-hover-strong text-faint",
                  )}
                >
                  {formatNumber(tab.count)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-[248px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari username…"
                aria-label="Cari username"
                className="h-9 pl-9 pr-8 text-[12px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-strong"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              aria-label="Urutkan akun"
              className="h-9 text-[12px] sm:w-[140px]"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="username">Username A–Z</option>
            </Select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="animate-in-up flex flex-wrap items-center gap-2 border-b border-brand/20 bg-brand/[0.06] px-4 py-2.5 sm:px-5">
            <span className="text-[11.5px] font-medium text-accent">
              {selected.size} akun dipilih
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
                <FolderPlus className="size-3.5" />
                Pindahkan ke grup
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Batalkan
              </Button>
            </div>
          </div>
        )}

        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface/60 text-[9.5px] uppercase tracking-[0.12em] text-faint">
                <th className="w-10 px-4 py-2.5 sm:px-5">
                  <Checkbox
                    aria-label="Pilih semua akun di halaman ini"
                    checked={allSelected}
                    onChange={(event) => {
                      if (!data) return;
                      setSelected(
                        event.target.checked ? new Set(data.items.map((item) => item.id)) : new Set(),
                      );
                    }}
                  />
                </th>
                <th className="px-3 py-2.5 font-medium">Username</th>
                <th className="px-3 py-2.5 font-medium">Password</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                {!suspendedView && <th className="px-3 py-2.5 font-medium">Umur akun</th>}
                {suspendedView && (
                  <>
                    <th className="px-3 py-2.5 font-medium">Lama suspend</th>
                    <th className="px-3 py-2.5 font-medium">Akan terbuka</th>
                  </>
                )}
                <th className="px-3 py-2.5 font-medium">Grup</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">Aksi</th>
              </tr>
            </thead>
            <tbody className={cn(loading && "opacity-50 transition-opacity")}>
              {loading && !data &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-line/50">
                    <td colSpan={suspendedView ? 8 : 7} className="px-5 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))}

              {data?.items.map((account) => {
                const isSelected = selected.has(account.id);
                const password = revealed[account.id];
                return (
                  <tr
                    key={account.id}
                    className={cn(
                      "border-b border-line/50 transition last:border-0 hover:bg-hover",
                      isSelected && "bg-brand/[0.04]",
                    )}
                  >
                    <td className="px-4 py-2.5 sm:px-5">
                      <Checkbox
                        aria-label={`Pilih ${account.username}`}
                        checked={isSelected}
                        onChange={(event) => {
                          setSelected((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(account.id);
                            else next.delete(account.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={account.username} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-medium text-body">
                            {account.username}
                          </p>
                          <p className="text-[9.5px] text-faint">Dibuat {formatDate(account.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "min-w-[92px] font-mono text-[11.5px]",
                            password ? "text-body" : "tracking-[0.18em] text-faint",
                          )}
                        >
                          {password ?? "••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => reveal(account)}
                          disabled={revealing === account.id}
                          aria-label={password ? `Sembunyikan password ${account.username}` : `Tampilkan password ${account.username}`}
                          title={password ? "Sembunyikan" : "Tampilkan password (tercatat di audit)"}
                          className="rounded-md p-1 text-faint transition hover:bg-hover-strong hover:text-strong disabled:opacity-40"
                        >
                          {password ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={account.status} />
                    </td>
                    {!suspendedView && (
                      <td className="px-3 py-2.5 text-[11.5px] text-body">
                        {formatAccountAge(account.createdAt)}
                      </td>
                    )}
                    {suspendedView && (
                      <>
                        <td className="px-3 py-2.5">
                          <p className="text-[11.5px] text-body">
                            {account.suspendedAt ? formatSuspendAge(account.suspendedAt) : "—"}
                          </p>
                          <p className="text-[9.5px] text-faint">
                            {account.suspendedAt ? `sejak ${formatDate(account.suspendedAt)}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          {account.suspendedUntil ? (
                            isReopened(account) ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                                <span className="size-1.5 rounded-full bg-success" />
                                Sudah terbuka
                              </span>
                            ) : (
                              <div>
                                <p className="tabular text-[11.5px] font-medium text-body">
                                  {formatCountdown(account.suspendedUntil)}
                                </p>
                                <p className="text-[9.5px] text-faint">lagi</p>
                              </div>
                            )
                          ) : (
                            <span className="text-[10.5px] text-faint">Tidak dijadwalkan</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2.5">
                      {account.groupNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          <span className="rounded-md border border-line bg-hover px-1.5 py-0.5 text-[9.5px] text-body">
                            {account.groupNames[0]}
                          </span>
                          {account.groupNames.length > 1 && (
                            <span className="rounded-md border border-line bg-hover px-1.5 py-0.5 text-[9.5px] text-faint">
                              +{account.groupNames.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-faint">Belum ada</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 sm:px-5">
                      <div className="flex items-center justify-end gap-1">
                        {isReopened(account) && (
                          <button
                            type="button"
                            onClick={() => restore([account.id])}
                            aria-label={`Pulihkan ${account.username}`}
                            title="Pulihkan akun menjadi tersedia"
                            className="rounded-lg p-1.5 text-faint transition hover:bg-success/10 hover:text-success"
                          >
                            <RotateCcw className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(account);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${account.username}`}
                          title="Edit akun"
                          className="rounded-lg p-1.5 text-faint transition hover:bg-brand/10 hover:text-accent"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(account)}
                          aria-label={`Hapus ${account.username}`}
                          title="Hapus akun"
                          className="rounded-lg p-1.5 text-faint transition hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && data && data.items.length === 0 && (
          <EmptyState
            icon={<Users className="size-5" />}
            title="Tidak ada akun yang cocok"
            description={
              query
                ? `Tidak ditemukan username yang mengandung “${query}”. Coba kata kunci lain atau reset filter.`
                : "Belum ada akun pada filter ini. Tambahkan akun baru untuk mulai mengelola."
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Reset filter
              </Button>
            }
          />
        )}

        {data && data.items.length > 0 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPage={setPage}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-faint">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-success" />
          Password dienkripsi AES-256-GCM · pembukaan kredensial dicatat pada audit trail
        </p>
        <p className="flex items-center gap-1.5">
          <Check className="size-3.5 text-success" />
          Paginasi server-side · siap untuk 5.000+ akun
        </p>
      </div>

      {formOpen && (
        <AccountFormModal
          open={formOpen}
          account={editing}
          onClose={() => setFormOpen(false)}
          onSaved={(message) => {
            setFormOpen(false);
            pushToast(message ?? (editing ? "Perubahan akun disimpan." : "Akun baru berhasil ditambahkan."));
            refresh();
          }}
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus akun?"
        description="Tindakan ini tidak dapat dibatalkan. Sesi dan keanggotaan grup terkait juga akan dihapus."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="danger" onClick={remove} loading={deleting}>
              <Trash2 className="size-3.5" />
              Hapus permanen
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-line bg-hover p-3.5">
          <p className="text-[12px] text-muted">
            Akun yang akan dihapus:{" "}
            <span className="font-medium text-strong">{deleteTarget?.username}</span>
          </p>
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Pindahkan ke grup"
        description={`${selected.size} akun terpilih akan dipindahkan. Satu akun hanya berada dalam satu grup.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)} disabled={assigning}>
              Batal
            </Button>
            <Button onClick={assign} loading={assigning} disabled={!assignGroup}>
              <FolderPlus className="size-3.5" />
              Pindahkan
            </Button>
          </>
        }
      >
        <Field label="Grup tujuan" htmlFor="assign-group">
          <Select
            id="assign-group"
            value={assignGroup}
            onChange={(event) => setAssignGroup(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} · {group.memberIds.length} anggota
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}
