# BLOX MANAGER

Aplikasi internal untuk mengelola, memantau, dan mengalokasikan akun Roblox dalam jumlah besar. Dibangun berdasarkan PRD BLOX MANAGER v1.0.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Data demo (1.204 akun, 3 grup, 144 sesi) dibuat otomatis di `data/blox.json` saat API pertama kali dipanggil.

### Akun demo

| Email | Username | Password |
| --- | --- | --- |
| `admin@blox.local` | `admin` | `BloxAdmin123!` |

Ganti kredensial ini (atau hapus user demo) sebelum dipakai di lingkungan nyata.

## Autentikasi & verifikasi email

- **Login** di `/login` memakai email **atau** username + password. Sesi disimpan sebagai cookie HttpOnly 30 hari.
- **Register** di `/register` membutuhkan email, username, dan password (min. 8 karakter, huruf + angka), lalu mengirim tautan verifikasi 24 jam.
- **Lupa password** di `/forgot-password` mengirim tautan reset sekali pakai (60 menit); semua sesi lama dicabut setelah password diganti.
- Password user di-hash dengan **scrypt** (`src/lib/password.ts`), bukan dienkripsi, dan tidak pernah dikembalikan API.
- Seluruh halaman dashboard dan endpoint data dilindungi sesi; tanpa login akan diarahkan ke `/login` atau menerima `401`.

### Konfigurasi email (Resend)

Verifikasi email dan reset password dikirim lewat [Resend](https://resend.com). Salin `.env.example` menjadi `.env.local` lalu isi:

```bash
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM="BLOX MANAGER <noreply@domainkamu.com>"
APP_URL=http://localhost:3000
```

`MAIL_FROM` harus memakai domain yang sudah diverifikasi di Resend. Selama `RESEND_API_KEY` kosong, email tidak dikirim; tautan verifikasi/reset ditampilkan di UI (mode pengembangan) dan dicetak ke console server agar alur tetap bisa diuji.

Perintah lain:

```bash
npm run lint       # ESLint
npx tsc --noEmit   # Type check
npm run build      # Production build
```

## Fitur

- **Dashboard** — metrik total/aktif/tersedia/tersuspend, grafik tren 7/30 hari interaktif, alokasi perangkat, peringatan suspend, aktivitas terbaru, ekspor CSV.
- **Master Account** — CRUD, pencarian username, filter status, sorting, paginasi server-side, password tersensor dengan reveal tercatat audit, bulk pilih & pindah grup.
- **Aktivitas** — riwayat sesi, mulai/akhiri sesi dengan tipe perangkat (PC, Handphone, Redfingers), durasi live, proteksi multiple login (409).
- **Group** — grup per environment, multi-select bulk add/remove, drag-and-drop akun ke kartu grup, edit/hapus grup.
- **Pengaturan** — ubah username, ganti password (dengan verifikasi password lama), daftar sesi aktif, cabut sesi per perangkat, dan keluar dari semua perangkat.

## Keamanan & data

- Password dienkripsi **AES-256-GCM** sebelum disimpan (`src/lib/crypto.ts`), kunci diturunkan dari `BLOX_SECRET`.
- API tidak pernah mengembalikan ciphertext/password kecuali lewat endpoint reveal, yang selalu menulis audit trail.
- Audit trail mencatat timestamp presisi untuk setiap suspend, reveal, dan perubahan alokasi.

Untuk produksi, set `BLOX_SECRET` yang kuat dan ganti penyimpanan JSON dengan database (PostgreSQL/SQLite) — lapisan akses data terisolasi di `src/lib/store.ts`.
