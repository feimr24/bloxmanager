"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Gagal menyimpan password baru.");
        return;
      }
      setDone(true);
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <AuthCard
        title="Tautan tidak valid"
        description="Tautan reset password tidak lengkap atau sudah kedaluwarsa."
        footer={
          <Link href="/forgot-password" className="font-medium text-accent hover:text-accent/80">
            Minta tautan reset baru
          </Link>
        }
      >
        <AuthAlert tone="error">
          Buka tautan reset dari email terbaru, atau minta tautan baru.
        </AuthAlert>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Password diperbarui"
        description="Password baru sudah tersimpan dan semua sesi lama telah dikeluarkan."
        footer={
          <Link href="/login" className="font-medium text-accent hover:text-accent/80">
            Masuk dengan password baru
          </Link>
        }
      >
        <AuthAlert tone="success">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-3.5" /> Berhasil
          </span>
          <span className="mt-1 block">Silakan masuk kembali memakai password baru kamu.</span>
        </AuthAlert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Buat password baru"
      description="Password minimal 8 karakter dan mengandung huruf serta angka."
      footer={
        <Link href="/login" className="font-medium text-accent hover:text-accent/80">
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeft className="size-3.5" /> Kembali ke halaman masuk
          </span>
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Password baru" htmlFor="password" hint="Min. 8 karakter">
          <PasswordInput
            id="password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Kombinasi huruf dan angka"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field label="Konfirmasi password baru" htmlFor="confirm">
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Ulangi password baru"
            autoComplete="new-password"
            required
          />
        </Field>

        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <Button type="submit" className="w-full" size="lg" loading={saving}>
          {!saving && <KeyRound className="size-4" />}
          Simpan password
        </Button>
      </form>
    </AuthCard>
  );
}
