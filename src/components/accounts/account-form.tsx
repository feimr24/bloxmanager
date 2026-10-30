"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { AccountRow, AccountStatus } from "@/lib/types";

export interface AccountFormValues {
  username: string;
  password: string;
  status: AccountStatus;
  createdAt: string;
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
  onSaved: () => void;
}) {
  const editing = Boolean(account);
  const [values, setValues] = useState<AccountFormValues>({
    username: account?.username ?? "",
    password: "",
    status: account?.status ?? "available",
    createdAt: account?.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        username: values.username,
        status: values.status,
        createdAt: new Date(values.createdAt).toISOString(),
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
      onSaved();
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
      title={editing ? "Edit Akun" : "Tambah Akun Baru"}
      description={
        editing
          ? "Perbarui kredensial atau status akun. Password lama tetap tersimpan bila dikosongkan."
          : "Password dienkripsi AES-256-GCM sebelum disimpan ke database."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} loading={saving}>
            <KeyRound className="size-3.5" />
            {editing ? "Simpan perubahan" : "Simpan akun"}
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

        <Field
          label="Password"
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
                className="rounded-md p-1.5 text-faint transition hover:bg-white/[0.06] hover:text-slate-200"
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

        {error && (
          <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-[#ffb3b3]">
            {error}
          </p>
        )}

        <p className="rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-[10.5px] leading-relaxed text-faint">
          Perubahan status menjadi tersuspend akan otomatis mencatat timestamp presisi di audit trail.
        </p>
      </form>
    </Modal>
  );
}
