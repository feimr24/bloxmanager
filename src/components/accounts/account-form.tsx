"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Layers, UserRound } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AccountRow, AccountStatus } from "@/lib/types";

export interface AccountFormValues {
  username: string;
  password: string;
  status: AccountStatus;
  createdAt: string;
  suspendDays: number;
  usernamesText: string;
}

export function AccountFormModal({
  open,
  onClose,
  account,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  account: AccountRow | null;
  onSaved: (message?: string) => void;
}) {
  const editing = Boolean(account);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [values, setValues] = useState<AccountFormValues>({
    username: account?.username ?? "",
    password: "",
    status: account?.status ?? "available",
    createdAt: account?.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    suspendDays: 7,
    usernamesText: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedUsernames = useMemo(
    () =>
      Array.from(
        new Set(
          values.usernamesText
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ),
    [values.usernamesText],
  );

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (!editing && mode === "bulk") {
        const response = await fetch("/api/accounts/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: parsedUsernames,
            password: values.password,
            status: values.status,
            createdAt: new Date(values.createdAt).toISOString(),
            suspendDays: values.suspendDays,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Gagal menambahkan akun");
          return;
        }
        const skipped = data.skipped.length as number;
        onSaved(
          `${data.created.length} akun berhasil ditambahkan${skipped > 0 ? `, ${skipped} dilewati (duplikat/tidak valid)` : ""}.`,
        );
        return;
      }

      const payload: Record<string, unknown> = {
        username: values.username,
        status: values.status,
        createdAt: new Date(values.createdAt).toISOString(),
        suspendDays: values.suspendDays,
      };
      if (values.password || !editing) payload.password = values.password;

      const response = await fetch(editing ? `/api/accounts/${account?.id}` : "/api/accounts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Gagal menyimpan akun");
        return;
      }
      const removed = Array.isArray(data.removedFromGroups)
        ? (data.removedFromGroups as string[])
        : [];
      onSaved(
        editing
          ? removed.length > 0
            ? `Perubahan disimpan. Akun dikeluarkan dari grup ${removed.join(", ")}.`
            : "Perubahan akun disimpan."
          : "Akun baru berhasil ditambahkan.",
      );
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
      title={editing ? "Edit Akun" : mode === "bulk" ? "Tambah Akun Massal" : "Tambah Akun Baru"}
      description={
        editing
          ? "Perbarui kredensial atau status akun. Password lama tetap tersimpan bila dikosongkan."
          : mode === "bulk"
            ? "Banyak username, satu password. Password dienkripsi AES-256-GCM untuk setiap akun."
            : "Password dienkripsi AES-256-GCM sebelum disimpan ke database."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!editing && mode === "bulk" && parsedUsernames.length === 0}
          >
            {mode === "bulk" && !editing ? <Layers className="size-3.5" /> : <KeyRound className="size-3.5" />}
            {editing
              ? "Simpan perubahan"
              : mode === "bulk"
                ? `Tambah ${parsedUsernames.length || ""} akun`
                : "Simpan akun"}
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
        {!editing && (
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-hover p-1" role="tablist" aria-label="Mode tambah akun">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "single"}
              onClick={() => {
                setMode("single");
                setError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition",
                mode === "single" ? "bg-card text-strong shadow-sm" : "text-muted hover:text-strong",
              )}
            >
              <UserRound className="size-3.5" /> Satu akun
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "bulk"}
              onClick={() => {
                setMode("bulk");
                setError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition",
                mode === "bulk" ? "bg-card text-strong shadow-sm" : "text-muted hover:text-strong",
              )}
            >
              <Layers className="size-3.5" /> Tambah massal
            </button>
          </div>
        )}

        {!editing && mode === "bulk" ? (
          <Field
            label="Daftar username"
            htmlFor="usernames"
            hint={`${parsedUsernames.length} username unik`}
          >
            <Textarea
              id="usernames"
              autoFocus
              value={values.usernamesText}
              onChange={(event) => setValues({ ...values, usernamesText: event.target.value })}
              placeholder={"blox_farm01\nblox_farm02\nblox_farm03"}
              className="min-h-[132px] font-mono text-[12px] leading-relaxed"
              required
            />
            <p className="mt-1 text-[10.5px] text-faint">
              Satu username per baris (bisa juga dipisah koma). Maksimal 200 akun sekali tambah.
            </p>
          </Field>
        ) : (
          <Field label="Username Roblox" htmlFor="username" hint="3–32 karakter">
            <Input
              id="username"
              autoFocus
              value={values.username}
              onChange={(event) => setValues({ ...values, username: event.target.value })}
              placeholder="cth. blox_master99"
              autoComplete="off"
              required
            />
          </Field>
        )}

        <Field
          label={!editing && mode === "bulk" ? "Password untuk semua akun" : "Password"}
          htmlFor="password"
          hint={editing ? "Kosongkan bila tidak diubah" : "Minimal 4 karakter"}
        >
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
            placeholder={editing ? "••••••••" : "Password akun"}
            autoComplete="new-password"
            required={!editing}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="rounded-md p-1.5 text-faint transition hover:bg-hover-strong hover:text-body"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            }
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="status">
            <Select
              id="status"
              value={values.status}
              onChange={(event) =>
                setValues({ ...values, status: event.target.value as AccountStatus })
              }
            >
              <option value="active">Aktif</option>
              <option value="available">Tersedia</option>
              <option value="suspended">Tersuspend</option>
            </Select>
          </Field>
          <Field label="Tanggal pembuatan" htmlFor="createdAt">
            <Input
              id="createdAt"
              type="date"
              value={values.createdAt}
              onChange={(event) => setValues({ ...values, createdAt: event.target.value })}
              required
            />
          </Field>
        </div>

        {values.status === "suspended" && (
          <Field
            label="Durasi suspend"
            htmlFor="suspendDays"
            hint="Hitung mundur sampai akun terbuka kembali"
          >
            <Select
              id="suspendDays"
              value={String(values.suspendDays)}
              onChange={(event) =>
                setValues({ ...values, suspendDays: Number(event.target.value) })
              }
            >
              <option value="3">3 hari</option>
              <option value="7">7 hari</option>
              <option value="14">14 hari</option>
              <option value="30">30 hari</option>
              <option value="60">60 hari</option>
            </Select>
          </Field>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-danger">
            {error}
          </p>
        )}

        <p className="rounded-lg border border-line bg-hover px-3 py-2 text-[10.5px] leading-relaxed text-faint">
          Perubahan status menjadi tersuspend akan mencatat timestamp presisi, tanggal pemulihan
          otomatis, dan mengeluarkan akun dari semua grup.
        </p>
      </form>
    </Modal>
  );
}
