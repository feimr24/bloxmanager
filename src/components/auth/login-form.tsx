"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, LogIn, MailCheck, ShieldCheck } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-credentials";

export function LoginForm({
  verified,
  reset,
  registered,
  showDemo,
}: {
  verified: boolean;
  reset: boolean;
  registered: boolean;
  showDemo: boolean;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setUnverifiedEmail(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Tidak dapat masuk. Coba lagi.");
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(String(data.email ?? identifier));
        }
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard
      title="Masuk ke workspace"
      description="Gunakan email atau username yang sudah terdaftar untuk mengakses dashboard operasional."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-accent transition hover:text-accent/80">
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        {verified && (
          <AuthAlert tone="success">
            <span className="flex items-center gap-1.5 font-medium">
              <MailCheck className="size-3.5" /> Email berhasil diverifikasi
            </span>
            <span className="mt-1 block">Silakan masuk memakai akun yang baru dibuat.</span>
          </AuthAlert>
        )}
        {reset && (
          <AuthAlert tone="success">
            Password baru tersimpan. Silakan masuk kembali.
          </AuthAlert>
        )}
        {registered && !verified && (
          <AuthAlert tone="info">
            Akun dibuat. Verifikasi email terlebih dahulu sebelum masuk.
          </AuthAlert>
        )}

        <Field label="Email atau username" htmlFor="identifier">
          <Input
            id="identifier"
            autoFocus
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="admin@blox.local"
            autoComplete="username"
            leading={<AtSign className="size-3.5" />}
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint={
            <Link href="/forgot-password" className="font-medium text-accent hover:text-accent/80">
              Lupa password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password akun"
            autoComplete="current-password"
            required
          />
        </Field>

        {error && (
          <AuthAlert tone="error">
            {error}
            {unverifiedEmail && (
              <>
                {" "}
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-medium underline underline-offset-2"
                >
                  Kirim ulang verifikasi
                </Link>
                .
              </>
            )}
          </AuthAlert>
        )}

        <Button type="submit" className="w-full" size="lg" loading={saving}>
          {!saving && <LogIn className="size-4" />}
          Masuk
        </Button>
      </form>

      {showDemo && (
        <div className="mt-5 rounded-xl border border-line bg-hover px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-body">
            <ShieldCheck className="size-3.5 text-success" /> Akun demo
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-faint">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </p>
          <button
            type="button"
            onClick={() => {
              setIdentifier(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setError(null);
            }}
            className="mt-2 text-[11px] font-medium text-accent transition hover:text-accent/80"
          >
            Isi otomatis
          </button>
        </div>
      )}
    </AuthCard>
  );
}
