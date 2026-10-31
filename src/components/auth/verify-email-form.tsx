"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { AuthAlert, AuthCard } from "./auth-card";

type State =
  | { status: "loading" }
  | { status: "success"; username: string; email: string }
  | { status: "error"; message: string };

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, setState] = useState<State>(
    token ? { status: "loading" } : { status: "error", message: "Token verifikasi tidak ditemukan di tautan." },
  );
  useEffect(() => {
    if (!token) return;

    let alive = true;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!alive) return;
        if (!response.ok) {
          setState({ status: "error", message: data.error ?? "Verifikasi gagal." });
          return;
        }
        setState({ status: "success", username: data.user.username, email: data.user.email });
      })
      .catch(() => {
        if (alive) setState({ status: "error", message: "Tidak dapat menghubungi server." });
      });

    return () => {
      alive = false;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <AuthCard
        title="Memverifikasi email"
        description="Mohon tunggu sebentar, kami sedang mengaktifkan akun kamu."
      >
        <div className="flex items-center gap-3 rounded-xl border border-line bg-hover px-4 py-3 text-[12px] text-muted">
          <Loader2 className="size-4 animate-spin text-accent" />
          Memeriksa tautan verifikasi…
        </div>
      </AuthCard>
    );
  }

  if (state.status === "success") {
    return (
      <AuthCard
        title="Email terverifikasi"
        description="Akun kamu sudah aktif dan bisa dipakai untuk masuk ke dashboard."
        footer={
          <span className="text-[12px] text-muted">
            Masuk dengan username <strong className="text-body">{state.username}</strong> atau email{" "}
            <strong className="text-body">{state.email}</strong>.
          </span>
        }
      >
        <div className="space-y-4">
          <AuthAlert tone="success">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5" /> Verifikasi berhasil
            </span>
            <span className="mt-1 block">Selamat datang di BLOX MANAGER.</span>
          </AuthAlert>
          <Link
            href="/login?verified=1"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#6b98ff] to-[#3b6cf6] text-sm font-medium text-white shadow-[0_8px_22px_-10px_rgba(59,108,246,0.9)] transition hover:from-[#7ea6ff] hover:to-[#4a78f8]"
          >
            <MailCheck className="size-4" /> Masuk sekarang
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verifikasi gagal"
      description="Tautan mungkin sudah kedaluwarsa, sudah dipakai, atau tidak lengkap."
      footer={
        <Link href="/login" className="font-medium text-accent hover:text-accent/80">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <div className="space-y-4">
        <AuthAlert tone="error">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-3.5" /> Tidak dapat memverifikasi
          </span>
          <span className="mt-1 block">{state.message}</span>
        </AuthAlert>
        <Link
          href="/resend-verification"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-elevated text-sm font-medium text-body transition hover:bg-hover-strong"
        >
          Kirim ulang email verifikasi
        </Link>
      </div>
    </AuthCard>
  );
}
