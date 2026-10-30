"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  FolderKanban,
  FolderPlus,
  GripVertical,
  Laptop,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import type { AccountRow, DeviceType, GroupRow } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { pushToast } from "@/components/ui/toast";

const DEVICE_META: Record<DeviceType, { label: string; icon: typeof Laptop; color: string; ring: string }> = {
  pc: { label: "PC / Rig", icon: Laptop, color: "#5b8cff", ring: "border-brand/25 bg-brand/10 text-[#9db9ff]" },
  handphone: { label: "Handphone", icon: Smartphone, color: "#58c7f3", ring: "border-info/25 bg-info/10 text-info" },
  redfingers: { label: "Redfingers", icon: Cloud, color: "#a78bfa", ring: "border-[#a78bfa]/25 bg-[#a78bfa]/10 text-[#c4b5fd]" },
};

const CAPACITY = 200;

export function GroupsView() {
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addDebounced, setAddDebounced] = useState("");
  const [candidates, setCandidates] = useState<AccountRow[]>([]);
  const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberSelected, setMemberSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupRow | null>(null);

  function loadGroups() {
    return fetch("/api/groups", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { groups: GroupRow[] }) => {
        setGroups(payload.groups);
        setSelectedId((current) => current ?? payload.groups[0]?.id ?? null);
      })
      .catch(() => pushToast("Gagal memuat grup", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setAddDebounced(addQuery), 280);
    return () => window.clearTimeout(timer);
  }, [addQuery]);

  useEffect(() => {
    if (!addOpen) return;
    let alive = true;
    fetch(`/api/accounts?pageSize=100&query=${encodeURIComponent(addDebounced)}&sort=username`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload: { items: AccountRow[] }) => {
        if (alive) setCandidates(payload.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoadingCandidates(false);
      });
    return () => {
      alive = false;
    };
  }, [addOpen, addDebounced]);

  const selected = groups?.find((group) => group.id === selectedId) ?? null;
  const memberIds = useMemo(() => new Set(selected?.memberIds ?? []), [selected]);

  const available = candidates.filter(
    (account) => !memberIds.has(account.id) && account.status !== "suspended",
  );

  const filteredMembers = (selected?.members ?? []).filter((member) =>
    member.username.toLowerCase().includes(memberQuery.trim().toLowerCase()),
  );

  async function addAccounts(ids: string[], groupId: string) {
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addAccountIds: ids }),
      });
      if (!response.ok) throw new Error();
      const group = groups?.find((item) => item.id === groupId);
      pushToast(`${ids.length} akun ditambahkan ke ${group?.name ?? "grup"}.`);
      setAddSelected(new Set());
      setMemberSelected(new Set());
      await loadGroups();
    } catch {
      pushToast("Gagal menambahkan akun", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeMembers(ids: string[]) {
    if (!selected || ids.length === 0) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/groups/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeAccountIds: ids }),
      });
      if (!response.ok) throw new Error();
      pushToast(`${ids.length} akun dikeluarkan dari grup.`);
      setMemberSelected(new Set());
      await loadGroups();
    } catch {
      pushToast("Gagal mengeluarkan akun", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/groups/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      pushToast(`Grup ${deleteTarget.name} dihapus.`);
      setDeleteTarget(null);
      setSelectedId(null);
      await loadGroups();
    } catch {
      pushToast("Gagal menghapus grup", "error");
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(accountId: string, groupId: string) {
    setDragOver(null);
    if (!accountId || memberIds.has(accountId)) return;
    addAccounts([accountId], groupId);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Bulk Allocation"
        title="Group"
        description="Kelompokkan akun per environment. Pindahkan 10–20 akun sekaligus lewat multi-select atau drag-and-drop."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <FolderPlus className="size-4" />
            Grup Baru
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-4">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[132px] rounded-2xl" />
            ))}

          {groups?.map((group) => {
            const meta = DEVICE_META[group.deviceType];
            const Icon = meta.icon;
            const active = group.id === selectedId;
            const percent = Math.min((group.memberIds.length / CAPACITY) * 100, 100);
            const isOver = dragOver === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setSelectedId(group.id);
                  setAddOpen(false);
                  setMemberQuery("");
                  setMemberSelected(new Set());
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(group.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(event.dataTransfer.getData("text/account-id"), group.id);
                }}
                aria-pressed={active}
                className={cn(
                  "card-surface animate-in-up w-full p-4 text-left transition-all",
                  active ? "border-brand/45 ring-1 ring-brand/20" : "hover:border-line-strong",
                  isOver && "border-success/60 bg-success/[0.06] ring-2 ring-success/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] border", meta.ring)}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-white">{group.name}</p>
                      {active && <span className="size-1.5 shrink-0 rounded-full bg-brand" />}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10.5px] text-faint">{group.description}</p>
                  </div>
                  <MoreHorizontal className="size-4 shrink-0 text-faint" />
                </div>

                <div className="mt-3 flex items-center justify-between text-[10.5px]">
                  <span className="text-muted">
                    <span className="tabular font-semibold text-slate-200">{formatNumber(group.memberIds.length)}</span>{" "}
                    anggota
                  </span>
                  <span className="text-faint">{percent.toFixed(0)}% kapasitas</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percent}%`, background: meta.color }}
                  />
                </div>
                {isOver && (
                  <p className="mt-2 text-center text-[10px] font-medium text-success">
                    Lepaskan akun untuk dipindahkan ke grup ini
                  </p>
                )}
              </button>
            );
          })}

          <div className="rounded-xl border border-dashed border-line-strong/70 px-4 py-3 text-[10.5px] leading-relaxed text-faint">
            <span className="flex items-center gap-1.5 font-medium text-slate-400">
              <GripVertical className="size-3.5" /> Tips alokasi
            </span>
            Seret akun dari panel “Tambah akun” langsung ke kartu grup, atau pilih beberapa akun sekaligus dengan
            checkbox.
          </div>
        </div>

        <div className="xl:col-span-8">
          {selected ? (
            <div className="card-surface panel-glow animate-in-up overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[16px] font-semibold text-white">{selected.name}</h2>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", DEVICE_META[selected.deviceType].ring)}>
                      {DEVICE_META[selected.deviceType].label}
                    </span>
                  </div>
                  <p className="mt-1 max-w-lg text-[11.5px] leading-relaxed text-muted">{selected.description}</p>
                  <p className="mt-1.5 text-[10px] text-faint">
                    Dibuat {new Date(selected.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}{" "}
                    · {selected.memberIds.length} akun teralokasi
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditing(selected);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(selected)}>
                    <Trash2 className="size-3.5" /> Hapus
                  </Button>
                </div>
              </div>

              {addOpen && (
                <div className="animate-in-up border-b border-line bg-[#080f1c]/60 px-4 py-4 sm:px-5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-[12.5px] font-semibold text-white">Tambah akun ke grup</p>
                      <p className="text-[10.5px] text-faint">
                        Pilih beberapa akun (bulk) atau seret satu akun ke kartu grup.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      aria-label="Tutup panel tambah akun"
                      className="rounded-lg p-1.5 text-faint hover:bg-white/[0.06] hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
                    <Input
                      value={addQuery}
                      onChange={(event) => setAddQuery(event.target.value)}
                      placeholder="Cari akun tersedia…"
                      aria-label="Cari akun untuk ditambahkan"
                      className="h-9 pl-9 text-[12px]"
                    />
                  </div>

                  <div className="max-h-[220px] overflow-y-auto rounded-xl border border-line bg-[#070d18]">
                    {loadingCandidates && <p className="px-3 py-4 text-center text-[11px] text-faint">Memuat akun…</p>}
                    {!loadingCandidates && available.length === 0 && (
                      <p className="px-3 py-4 text-center text-[11px] text-faint">
                        Tidak ada akun tersedia yang cocok.
                      </p>
                    )}
                    {available.slice(0, 60).map((account) => {
                      const checked = addSelected.has(account.id);
                      return (
                        <label
                          key={account.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/account-id", account.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 border-b border-line/50 px-3 py-2 transition last:border-0 hover:bg-white/[0.03]",
                            checked && "bg-brand/[0.05]",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onChange={(event) => {
                              setAddSelected((current) => {
                                const next = new Set(current);
                                if (event.target.checked) next.add(account.id);
                                else next.delete(account.id);
                                return next;
                              });
                            }}
                          />
                          <Avatar name={account.username} size="xs" />
                          <span className="min-w-0 flex-1 truncate text-[11.5px] text-slate-200">
                            {account.username}
                          </span>
                          {account.groupNames.length > 0 && (
                            <span className="hidden truncate rounded border border-line px-1.5 py-0.5 text-[9px] text-faint sm:block">
                              {account.groupNames[0]}
                            </span>
                          )}
                          <StatusBadge status={account.status} />
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <p className="text-[10.5px] text-faint">{addSelected.size} dipilih</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setAddSelected(new Set())}>
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addAccounts(Array.from(addSelected), selected.id)}
                        loading={busy}
                        disabled={addSelected.size === 0}
                      >
                        <Plus className="size-3.5" />
                        Tambahkan {addSelected.size > 0 ? addSelected.size : ""} akun
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-5">
                <div className="relative min-w-0 flex-1 sm:max-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
                  <Input
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Cari anggota…"
                    aria-label="Cari anggota grup"
                    className="h-8 pl-8 text-[11.5px]"
                  />
                </div>
                {memberSelected.size > 0 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeMembers(Array.from(memberSelected))}
                    disabled={busy}
                  >
                    <UserMinus className="size-3.5" />
                    Keluarkan {memberSelected.size}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={addOpen ? "subtle" : "secondary"}
                  className="ml-auto"
                  onClick={() => {
                    if (!addOpen) setLoadingCandidates(candidates.length === 0);
                    setAddOpen((value) => !value);
                  }}
                >
                  <Plus className="size-3.5" />
                  Tambah akun
                </Button>
              </div>

              <div className="no-scrollbar max-h-[520px] overflow-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#0a1220]">
                    <tr className="border-b border-line text-[9.5px] uppercase tracking-[0.12em] text-faint">
                      <th className="w-10 px-4 py-2.5 sm:px-5">
                        <Checkbox
                          aria-label="Pilih semua anggota"
                          checked={filteredMembers.length > 0 && filteredMembers.every((member) => memberSelected.has(member.id))}
                          onChange={(event) => {
                            setMemberSelected(
                              event.target.checked ? new Set(filteredMembers.map((member) => member.id)) : new Set(),
                            );
                          }}
                        />
                      </th>
                      <th className="px-3 py-2.5 font-medium">Akun</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium sm:px-5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-line/50 transition last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 sm:px-5">
                          <Checkbox
                            aria-label={`Pilih ${member.username}`}
                            checked={memberSelected.has(member.id)}
                            onChange={(event) => {
                              setMemberSelected((current) => {
                                const next = new Set(current);
                                if (event.target.checked) next.add(member.id);
                                else next.delete(member.id);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={member.username} size="sm" />
                            <div>
                              <p className="text-[12px] font-medium text-slate-200">{member.username}</p>
                              <p className="text-[9.5px] text-faint">
                                {member.runningSession ? member.runningSession.deviceName : "Tidak ada sesi aktif"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-4 py-2.5 text-right sm:px-5">
                          <button
                            type="button"
                            onClick={() => removeMembers([member.id])}
                            aria-label={`Keluarkan ${member.username} dari grup`}
                            title="Keluarkan dari grup"
                            className="rounded-lg p-1.5 text-faint transition hover:bg-danger/10 hover:text-[#ff8e8e]"
                          >
                            <UserMinus className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredMembers.length === 0 && (
                  <EmptyState
                    icon={<Users className="size-5" />}
                    title="Grup ini masih kosong"
                    description="Tambahkan akun tersedia secara massal untuk mulai mengalokasikan perangkat."
                    action={
                      <Button size="sm" variant="secondary" onClick={() => { setLoadingCandidates(true); setAddOpen(true); }}>
                        <Plus className="size-3" /> Tambah akun
                      </Button>
                    }
                  />
                )}
              </div>

              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[10.5px] text-faint sm:px-5">
                <span>
                  {filteredMembers.length} dari {selected.memberIds.length} anggota ditampilkan
                </span>
                <span className="tabular">Kapasitas grup {CAPACITY} akun</span>
              </div>
            </div>
          ) : (
            <div className="card-surface flex h-full min-h-[320px] items-center justify-center p-6">
              <EmptyState
                icon={<FolderKanban className="size-5" />}
                title="Pilih grup"
                description="Pilih salah satu grup di kiri untuk melihat anggota dan mengelola alokasi akun."
              />
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <GroupFormModal
          key={editing?.id ?? "new"}
          open={formOpen}
          group={editing}
          onClose={() => setFormOpen(false)}
          onSaved={async (id) => {
            setFormOpen(false);
            await loadGroups();
            if (id) setSelectedId(id);
          }}
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus grup?"
        description="Akun di dalam grup tidak dihapus — mereka hanya kehilangan alokasi grup ini."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={busy}>
              Batal
            </Button>
            <Button variant="danger" onClick={deleteGroup} loading={busy}>
              <Trash2 className="size-3.5" /> Hapus grup
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5 text-[12px] text-muted">
          Grup <span className="font-medium text-white">{deleteTarget?.name}</span> berisi{" "}
          <span className="text-white">{deleteTarget?.memberIds.length}</span> akun.
        </div>
      </Modal>
    </div>
  );
}

function GroupFormModal({
  open,
  group,
  onClose,
  onSaved,
}: {
  open: boolean;
  group: GroupRow | null;
  onClose: () => void;
  onSaved: (id?: string) => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description === "Belum ada deskripsi." ? "" : group?.description ?? "");
  const [deviceType, setDeviceType] = useState<DeviceType>(group?.deviceType ?? "pc");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(group ? `/api/groups/${group.id}` : "/api/groups", {
        method: group ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, deviceType }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal menyimpan grup");
        return;
      }
      pushToast(group ? "Grup diperbarui." : "Grup baru dibuat.");
      onSaved(payload.group?.id);
    } catch {
      setError("Tidak dapat menghubungi server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={group ? "Edit Grup" : "Grup Baru"}
      description="Grup membantu mengalokasikan akun ke environment PC, handphone, atau cloud phone."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} loading={saving}>
            <FolderPlus className="size-3.5" />
            {group ? "Simpan perubahan" : "Buat grup"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Nama grup" htmlFor="group-name" hint="3–40 karakter">
          <Input
            id="group-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="cth. PC Rig Alpha"
            required
          />
        </Field>
        <Field label="Deskripsi" htmlFor="group-description" hint="opsional">
          <Textarea
            id="group-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tujuan alokasi grup ini…"
          />
        </Field>
        <Field label="Tipe perangkat" htmlFor="group-device">
          <Select
            id="group-device"
            value={deviceType}
            onChange={(event) => setDeviceType(event.target.value as DeviceType)}
          >
            <option value="pc">PC / Rig</option>
            <option value="handphone">Handphone</option>
            <option value="redfingers">Redfingers (Cloud Phone)</option>
          </Select>
        </Field>
        {error && (
          <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-[#ffb3b3]">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
