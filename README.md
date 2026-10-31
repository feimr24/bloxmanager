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

## Autentikasi

- **Login** di `/login` memakai email **atau** username + password. Sesi disimpan sebagai cookie HttpOnly 30 hari.
- **Register** di `/register` membutuhkan email, username, dan password (min. 8 karakter, huruf + angka). Akun langsung aktif dan email harus unik.
- Jika lupa password, pengguna menghubungi admin untuk reset manual. Fitur panel admin direncanakan terpisah.
- Password user di-hash dengan **scrypt** (`src/lib/password.ts`), bukan dienkripsi, dan tidak pernah dikembalikan API.
- Seluruh halaman dashboard dan endpoint data dilindungi sesi; tanpa login akan diarahkan ke `/login` atau menerima `401`.

Email dan username tersimpan pada data akun untuk kebutuhan administrasi. Reset password melalui email belum diaktifkan; admin dapat membantu pengguna sampai panel admin tersedia.

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

Untuk produksi, set `BLOX_SECRET` yang kuat. Penyimpanan dapat menggunakan Neon PostgreSQL melalui `BLOX_DATABASE_URL` (diutamakan) atau `DATABASE_URL`; tanpa keduanya aplikasi memakai `data/blox.json` lokal. Pada koneksi Neon pertama, jika tabel `blox_state` belum ada, aplikasi membuat tabel dan mengimpor data dari file JSON lokal (bila tersedia), atau membuat seed demo.

### Neon PostgreSQL

1. Buat project/database di [Neon Console](https://console.neon.tech/) dan salin **pooled connection string** dari menu Connect.
2. Set pooled connection string sebagai `BLOX_DATABASE_URL` di `.env.local` atau sebagai environment secret di platform hosting (misalnya Vercel). Variable app-specific ini diutamakan atas `DATABASE_URL` yang dikelola integrasi. Jangan commit connection string atau membagikannya di chat.
3. Jalankan `npm run dev`. Aplikasi otomatis membuat tabel `blox_state` dan memindahkan snapshot `data/blox.json` ke Neon saat koneksi pertama. Data Neon yang sudah ada tidak ditimpa oleh file lokal.
4. Cadangkan/ekspor data lokal sebelum beralih. Untuk kembali ke file lokal, hapus kedua variable database tersebut.

Koneksi memakai driver resmi Neon di server (bukan browser). Batasi akses ke connection string, gunakan pooled URL dan environment terpisah untuk dev/production. Saat ini aplikasi menyimpan satu snapshot JSONB; ini memudahkan migrasi tanpa perubahan perilaku, tetapi untuk banyak penulis bersamaan sebaiknya dimigrasikan ke tabel relasional/transaksi.
