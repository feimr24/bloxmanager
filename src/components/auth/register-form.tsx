"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MailCheck, MailPlus, UserPlus } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function RegisterForm() {
  const [values, setValues] = useState({
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ email: string; devLink?: string } | null>(null);
  const [resent, setResent] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (values.password !== values.confirm) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          username: values.username,
          password: values.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Pendaftaran gagal. Coba lagi.");
        return;
      }
      setResult({ email: values.email.trim().toLowerCase(), devLink: data.devLink });
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function resend() {
    if (!result) return;
    setResending(true);
    setResent(null);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Gagal mengirim ulang email.");
        return;
      }
      setResent(data.message ?? "Email verifikasi dikirim ulang.");
      if (data.devLink) setResult({ ...result, devLink: data.devLink });
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setResending(false);
    }
  }

  if (result) {
    return (
      <AuthCard
        title="Cek email kamu"
        description="Kami mengirim tautan verifikasi. Akun hanya bisa dipakai setelah email terverifikasi."
        footer={
          <>
            Sudah verifikasi?{" "}
            <Link href="/login" className="font-medium text-accent hover:text-accent/80">
              Masuk di sini
            </Link>
          </>
        }
      >
        <div className="space-y-4">
          <AuthAlert tone="success">
            <span className="flex items-center gap-1.5 font-medium">
              <MailCheck className="size-3.5" /> Email verifikasi terkirim
            </span>
            <span className="mt-1 block">
              Tautan dikirim ke <strong>{result.email}</strong>. Berlaku 24 jam.
            </span>
          </AuthAlert>

          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          {resent && <AuthAlert tone="info">{resent}</AuthAlert>}

          {result.devLink && (
            <div className="rounded-xl border border-warning/30 bg-warning/[0.07] px-3.5 py-3">
              <p className="text-[11px] font-medium text-warning">Mode pengembangan</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                RESEND_API_KEY belum diisi, jadi email tidak benar-benar dikirim. Buka tautan ini
                untuk memverifikasi:
              </p>
              <a
                href={result.devLink}
                className="mt-2 inline-block break-all text-[11px] font-medium text-accent underline underline-offset-2"
              >
                {result.devLink}
              </a>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="button" variant="secondary" onClick={resend} loading={resending} className="w-full">
              {!resending && <MailPlus className="size-4" />}
              Kirim ulang email verifikasi
            </Button>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-transparent text-[13px] font-medium text-muted transition hover:bg-hover-strong hover:text-strong"
            >
              Kembali ke halaman masuk <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Buat akun baru"
      description="Daftarkan email dan username. Kami akan mengirim tautan verifikasi sebelum akun bisa dipakai."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-accent hover:text-accent/80">
            Masuk
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email" htmlFor="email" hint="Untuk verifikasi">
          <Input
            id="email"
            type="email"
            autoFocus
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Username" htmlFor="username" hint="3–32 karakter">
          <Input
            id="username"
            value={values.username}
            onChange={(event) => update("username", event.target.value)}
            placeholder="blox_operator"
            autoComplete="username"
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" hint="Min. 8 karakter">
          <PasswordInput
            id="password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder="Kombinasi huruf dan angka"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field label="Konfirmasi password" htmlFor="confirm">
          <PasswordInput
            id="confirm"
            value={values.confirm}
            onChange={(event) => update("confirm", event.target.value)}
            placeholder="Ulangi password"
            autoComplete="new-password"
            required
          />
        </Field>

        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <Button type="submit" className="w-full" size="lg" loading={saving}>
          {!saving && <UserPlus className="size-4" />}
          Daftar & kirim verifikasi
        </Button>
      </form>
    </AuthCard>
  );
}
