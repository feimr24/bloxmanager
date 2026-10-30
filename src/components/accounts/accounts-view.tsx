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
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { AccountRow, AccountStatus, GroupRow } from "@/lib/types";
import { cn, formatDate, formatNumber, formatRelative } from "@/lib/utils";
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

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

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
                    ? "bg-white/[0.07] text-white"
                    : "text-muted hover:bg-white/[0.03] hover:text-slate-200",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "tabular rounded px-1.5 py-0.5 text-[9.5px] font-semibold",
                    status === tab.value ? "bg-brand/20 text-[#b9cdff]" : "bg-white/[0.05] text-faint",
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-white"
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
            <span className="text-[11.5px] font-medium text-[#b9cdff]">
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
              <tr className="border-b border-line bg-[#080f1c]/60 text-[9.5px] uppercase tracking-[0.12em] text-faint">
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
                <th className="px-3 py-2.5 font-medium">Grup</th>
                <th className="px-3 py-2.5 font-medium">Terakhir aktif</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">Aksi</th>
              </tr>
            </thead>
            <tbody className={cn(loading && "opacity-50 transition-opacity")}>
              {loading && !data &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-line/50">
                    <td colSpan={7} className="px-5 py-3">
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
                      "border-b border-line/50 transition last:border-0 hover:bg-white/[0.02]",
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
                          <p className="truncate text-[12.5px] font-medium text-slate-100">
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
                            password ? "text-slate-200" : "tracking-[0.18em] text-slate-500",
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
                          className="rounded-md p-1 text-faint transition hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-40"
                        >
                          {password ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={account.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      {account.groupNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          <span className="rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] text-slate-300">
                            {account.groupNames[0]}
                          </span>
                          {account.groupNames.length > 1 && (
                            <span className="rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] text-faint">
                              +{account.groupNames.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-faint">Belum ada</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] text-slate-400">
                        {account.runningSession
                          ? "Sedang bermain"
                          : account.lastActiveAt
                            ? formatRelative(account.lastActiveAt)
                            : "—"}
                      </p>
                      {account.runningSession && (
                        <p className="text-[9.5px] text-success">{account.runningSession.deviceName}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 sm:px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(account);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${account.username}`}
                          title="Edit akun"
                          className="rounded-lg p-1.5 text-faint transition hover:bg-brand/10 hover:text-[#9db9ff]"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(account)}
                          aria-label={`Hapus ${account.username}`}
                          title="Hapus akun"
                          className="rounded-lg p-1.5 text-faint transition hover:bg-danger/10 hover:text-[#ff8e8e]"
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
          onSaved={() => {
            setFormOpen(false);
            pushToast(editing ? "Perubahan akun disimpan." : "Akun baru berhasil ditambahkan.");
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
        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <p className="text-[12px] text-muted">
            Akun yang akan dihapus:{" "}
            <span className="font-medium text-white">{deleteTarget?.username}</span>
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
