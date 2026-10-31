"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailPlus } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ResendVerificationForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState<{ message: string; devLink?: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Gagal mengirim email verifikasi.");
        return;
      }
      setSent({ message: data.message, devLink: data.devLink });
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard
      title="Kirim ulang verifikasi"
      description="Masukkan email yang dipakai saat mendaftar. Kami akan mengirim tautan verifikasi baru."
      footer={
        <Link href="/login" className="font-medium text-accent hover:text-accent/80">
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeft className="size-3.5" /> Kembali ke halaman masuk
          </span>
        </Link>
      }
    >
      <div className="space-y-4">
        {sent && (
          <>
            <AuthAlert tone="success">{sent.message}</AuthAlert>
            {sent.devLink && (
              <div className="rounded-xl border border-warning/30 bg-warning/[0.07] px-3.5 py-3">
                <p className="text-[11px] font-medium text-warning">Mode pengembangan</p>
                <a
                  href={sent.devLink}
                  className="mt-2 inline-block break-all text-[11px] font-medium text-accent underline underline-offset-2"
                >
                  {sent.devLink}
                </a>
              </div>
            )}
          </>
        )}

        <form className="space-y-4" onSubmit={submit}>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@perusahaan.com"
              autoComplete="email"
              required
            />
          </Field>

          {error && <AuthAlert tone="error">{error}</AuthAlert>}

          <Button type="submit" className="w-full" size="lg" loading={saving}>
            {!saving && <MailPlus className="size-4" />}
            Kirim tautan verifikasi
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
