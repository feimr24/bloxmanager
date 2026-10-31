"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  KeyRound,
  Laptop,
  LogOut,
  MailCheck,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/layout";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { pushToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils";

interface SettingsUser {
  username: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface SessionItem {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ip: string | null;
  current: boolean;
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return { label: "Perangkat tidak dikenal", mobile: false };

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Browser";

  const os = /Android/i.test(userAgent)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(userAgent)
      ? "iOS"
      : /Mac OS X/i.test(userAgent)
        ? "macOS"
        : /Windows/i.test(userAgent)
          ? "Windows"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "";

  return {
    label: os ? `${browser} · ${os}` : browser,
    mobile: /Android|iPhone|iPad|iPod/i.test(userAgent),
  };
}

export function SettingsView({
  user,
  sessions,
}: {
  user: SettingsUser;
  sessions: SessionItem[];
}) {
  const router = useRouter();

  const [username, setUsername] = useState(user.username);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [busySession, setBusySession] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        setProfileError(data.error ?? "Gagal menyimpan profil.");
        return;
      }
      pushToast("Profil berhasil diperbarui.");
      router.refresh();
    } catch {
      setProfileError("Tidak dapat menghubungi server.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (passwords.next !== passwords.confirm) {
      setPasswordError("Konfirmasi password baru belum sama.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error ?? "Gagal mengubah password.");
        return;
      }
      setPasswords({ current: "", next: "", confirm: "" });
      pushToast("Password diperbarui. Semua sesi lain sudah dikeluarkan.");
      router.refresh();
    } catch {
      setPasswordError("Tidak dapat menghubungi server.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function revoke(scope: "others" | "all" | string) {
    if (scope === "all") setLoggingOutAll(true);
    else setBusySession(scope);
    try {
      const body = scope === "others" || scope === "all" ? { scope } : { sessionId: scope };
      const response = await fetch("/api/settings/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        pushToast(data.error ?? "Gagal mencabut sesi.", "error");
        return;
      }
      if (data.loggedOut) {
        router.replace("/login");
        router.refresh();
        return;
      }
      pushToast(
        scope === "others"
          ? "Semua sesi lain dicabut."
          : "Sesi berhasil dicabut.",
      );
      router.refresh();
    } catch {
      pushToast("Tidak dapat menghubungi server.", "error");
    } finally {
      setBusySession(null);
      setLoggingOutAll(false);
    }
  }

  const otherSessions = sessions.filter((session) => !session.current).length;

  return (
    <div>
      <PageHeader
        eyebrow="Account Settings"
        title="Pengaturan"
        description="Kelola profil, password, dan sesi akun BLOX MANAGER kamu."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="card-surface panel-glow animate-in-up p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-accent">
              <UserRound className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-strong">Profil akun</h2>
              <p className="text-[11px] text-faint">Nama yang tampil di sidebar dan topbar.</p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-hover px-3.5 py-3">
            <Avatar name={user.username} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-body">{user.username}</p>
              <p className="truncate text-[10.5px] text-faint">{user.email}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <Check className="size-2.5" /> Terverifikasi
            </span>
          </div>

          <form className="space-y-4" onSubmit={saveProfile}>
            <Field label="Username" htmlFor="username" hint="3–32 karakter">
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </Field>

            <Field label="Email" htmlFor="email" hint="Tidak dapat diubah">
              <Input id="email" value={user.email} disabled readOnly />
            </Field>

            <div className="grid grid-cols-1 gap-2 text-[11px] text-faint sm:grid-cols-2">
              <p>Terdaftar {formatDate(user.createdAt)}</p>
              <p className="sm:text-right">
                Login terakhir{" "}
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}
              </p>
            </div>

            {profileError && (
              <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-danger">
                {profileError}
              </p>
            )}

            <Button type="submit" loading={savingProfile} disabled={username.trim() === user.username}>
              {!savingProfile && <Save className="size-3.5" />}
              Simpan profil
            </Button>
          </form>
        </section>

        <section className="card-surface panel-glow animate-in-up p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-warning/20 bg-warning/10 text-warning">
              <KeyRound className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-strong">Password akun</h2>
              <p className="text-[11px] text-faint">
                Minimal 8 karakter, kombinasi huruf dan angka.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={savePassword}>
            <Field label="Password saat ini" htmlFor="current-password">
              <PasswordInput
                id="current-password"
                value={passwords.current}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, current: event.target.value }))
                }
                placeholder="Masukkan password sekarang"
                autoComplete="current-password"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Password baru" htmlFor="new-password" hint="Min. 8 karakter">
                <PasswordInput
                  id="new-password"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, next: event.target.value }))
                  }
                  placeholder="Password baru"
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field label="Konfirmasi" htmlFor="confirm-password">
                <PasswordInput
                  id="confirm-password"
                  value={passwords.confirm}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, confirm: event.target.value }))
                  }
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  required
                />
              </Field>
            </div>

            {passwordError && (
              <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-danger">
                {passwordError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" loading={savingPassword}>
                {!savingPassword && <KeyRound className="size-3.5" />}
                Ubah password
              </Button>
              <p className="text-[10.5px] text-faint">
                Sesi lain otomatis dikeluarkan setelah password berubah.
              </p>
            </div>
          </form>
        </section>
      </div>

      <section className="card-surface panel-glow animate-in-up mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-strong">Sesi aktif</h2>
              <p className="text-[11px] text-faint">
                {sessions.length} sesi aktif · {otherSessions} di perangkat lain
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => revoke("others")}
              disabled={otherSessions === 0 || busySession !== null || loggingOutAll}
            >
              Cabut sesi lain
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => revoke("all")}
              loading={loggingOutAll}
            >
              {!loggingOutAll && <LogOut className="size-3.5" />}
              Keluar dari semua perangkat
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-line/60">
          {sessions.map((session) => {
            const device = deviceLabel(session.userAgent);
            return (
              <li key={session.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-field text-muted">
                    {device.mobile ? <Smartphone className="size-4" /> : <Laptop className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[12.5px] font-medium text-body">
                      {device.label}
                      {session.current && (
                        <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[9.5px] font-medium text-success">
                          Sesi ini
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-faint">
                      Masuk {formatDateTime(session.createdAt)}
                      {session.ip ? ` · ${session.ip}` : ""} · berlaku sampai{" "}
                      {formatDate(session.expiresAt)}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(session.id)}
                    loading={busySession === session.id}
                    disabled={busySession !== null || loggingOutAll}
                    className="self-start text-danger hover:bg-danger/10 hover:text-danger sm:self-auto"
                  >
                    {busySession !== session.id && <LogOut className="size-3.5" />}
                    Cabut
                  </Button>
                )}
              </li>
            );
          })}
          {sessions.length === 0 && (
            <li className="px-5 py-6 text-center text-[12px] text-faint">Tidak ada sesi aktif.</li>
          )}
        </ul>
      </section>

      <section className="card-surface panel-glow animate-in-up mt-4 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-hover text-muted">
            <MailCheck className="size-4" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-strong">Keamanan email</h2>
            <p className="text-[11px] text-faint">
              Email terverifikasi: <span className="text-body">{user.email}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-line bg-hover px-3.5 py-3 text-[11px] leading-relaxed text-faint">
          Perubahan email belum tersedia di versi ini. Untuk mengganti email, hubungi administrator
          agar akun dibuat ulang dengan alamat email baru.
        </p>
      </section>
    </div>
  );
}
