"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      title="Buat akun baru"
      description="Daftarkan email, username, dan password untuk membuat akun."
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
        <Field label="Email" htmlFor="email" hint="Gunakan email aktif; jika lupa password, hubungi admin.">
          <Input
            id="email"
            type="email"
            autoFocus
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="nama@email.com"
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
          Daftar
        </Button>
      </form>
    </AuthCard>
  );
}
