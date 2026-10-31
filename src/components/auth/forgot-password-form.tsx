"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthCard } from "./auth-card";

export function ForgotPasswordForm() {
  return (
    <AuthCard
      title="Lupa password"
      description="Lupa password? Hubungi admin untuk meminta bantuan reset password."
      footer={
        <Link href="/login" className="font-medium text-accent hover:text-accent/80">
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeft className="size-3.5" /> Kembali ke halaman masuk
          </span>
        </Link>
      }
    >
      <a
        href="mailto:admin@blox.local"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#6d99ff]/40 bg-gradient-to-b from-[#6b98ff] to-[#3b6cf6] px-5 text-sm font-medium text-white shadow-[0_8px_22px_-10px_rgba(59,108,246,0.9)]"
      >
        <Mail className="size-4" /> Hubungi admin untuk reset password
      </a>
    </AuthCard>
  );
}
