"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, LogIn } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginForm({
  reset,
  registered,
}: {
  reset: boolean;
  registered: boolean;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Tidak dapat masuk. Coba lagi.");
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
        {reset && (
          <AuthAlert tone="success">
            Password baru tersimpan. Silakan masuk kembali.
          </AuthAlert>
        )}
        {registered && <AuthAlert tone="success">Akun berhasil dibuat. Silakan masuk.</AuthAlert>}

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
          </AuthAlert>
        )}

        <Button type="submit" className="w-full" size="lg" loading={saving}>
          {!saving && <LogIn className="size-4" />}
          Masuk
        </Button>
      </form>

    </AuthCard>
  );
}
