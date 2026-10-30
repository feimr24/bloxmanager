"use client";

import { useEffect, useMemo, useState } from "react";
import { Cloud, Laptop, Play, Search, Smartphone } from "lucide-react";
import type { AccountRow, DeviceType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const DEVICES: { value: DeviceType; label: string; icon: typeof Laptop }[] = [
  { value: "pc", label: "PC", icon: Laptop },
  { value: "handphone", label: "Handphone", icon: Smartphone },
  { value: "redfingers", label: "Redfingers", icon: Cloud },
];

const DEVICE_NAMES: Record<DeviceType, string[]> = {
  pc: ["PC Rig-01", "PC Rig-02", "PC Rig-03", "PC Rig-04", "PC Rig-05", "PC Rig-06"],
  handphone: ["Poco X3", "Redmi Note 12", "iPhone 11", "Samsung A54", "Infinix Hot 12"],
  redfingers: ["Redfingers Server 1", "Redfingers Server 2", "Redfingers Server 3"],
};

export function StartSessionModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: () => void;
}) {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType>("pc");
  const [deviceName, setDeviceName] = useState(DEVICE_NAMES.pc[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    fetch("/api/accounts?pageSize=100&sort=username", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { items: AccountRow[] }) => {
        setAccounts(payload.items.filter((account) => account.status !== "suspended"));
        setAccountId((current) => current || payload.items.find((item) => item.status !== "suspended")?.id || "");
      })
      .catch(() => setError("Gagal memuat akun"))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts
      .filter((account) => (term ? account.username.toLowerCase().includes(term) : true))
      .slice(0, 8);
  }, [accounts, search]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, deviceType, deviceName, note }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal memulai sesi");
        return;
      }
      onStarted();
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
      title="Mulai Sesi Bermain"
      description="Pilih akun dan perangkat. Sistem mencegah akun yang sama berjalan di dua perangkat."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} loading={saving} disabled={!accountId}>
            <Play className="size-3.5" />
            Mulai sesi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Akun" htmlFor="session-search" hint={`${filtered.length} ditampilkan`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              id="session-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari username untuk memulai…"
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </Field>

        <div className="max-h-[196px] space-y-1 overflow-y-auto rounded-xl border border-line bg-[#080f1c] p-1.5">
          {loading && <p className="px-3 py-4 text-center text-[11.5px] text-faint">Memuat akun…</p>}
          {!loading && filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-[11.5px] text-faint">Akun tidak ditemukan.</p>
          )}
          {filtered.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => setAccountId(account.id)}
              aria-pressed={accountId === account.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                accountId === account.id ? "bg-brand/15 ring-1 ring-brand/30" : "hover:bg-white/[0.04]",
              )}
            >
              <Avatar name={account.username} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-slate-200">{account.username}</p>
                <p className="text-[9.5px] text-faint">
                  {account.runningSession ? `Sedang di ${account.runningSession.deviceName}` : account.status === "active" ? "Aktif" : "Tersedia"}
                </p>
              </div>
              {account.runningSession && (
                <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[9px] text-warning">in use</span>
              )}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-slate-300">Tipe perangkat</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipe perangkat">
            {DEVICES.map((device) => {
              const Icon = device.icon;
              const active = deviceType === device.value;
              return (
                <button
                  key={device.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setDeviceType(device.value);
                    setDeviceName(DEVICE_NAMES[device.value][0]);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11.5px] font-medium transition",
                    active
                      ? "border-brand/40 bg-brand/10 text-white"
                      : "border-line bg-white/[0.02] text-muted hover:border-line-strong hover:text-slate-200",
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-[#9db9ff]" : "text-faint")} />
                  {device.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama perangkat" htmlFor="device-name">
            <Input
              id="device-name"
              list="device-options"
              value={deviceName}
              onChange={(event) => setDeviceName(event.target.value)}
              placeholder="cth. PC Rig-01"
              required
            />
            <datalist id="device-options">
              {DEVICE_NAMES[deviceType].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Catatan" htmlFor="session-note" hint="opsional">
            <Textarea
              id="session-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="cth. farming event musiman"
              className="min-h-10 h-10 py-2"
            />
          </Field>
        </div>

        <p className="rounded-lg border border-warning/20 bg-warning/[0.05] px-3 py-2 text-[10.5px] leading-relaxed text-warning/90">
          Jangan memulai akun yang sama di perangkat lain. Multiple login dapat memicu suspend otomatis Roblox.
        </p>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-[#ffb3b3]">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
