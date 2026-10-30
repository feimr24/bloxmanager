# BLOX MANAGER

Aplikasi internal untuk mengelola, memantau, dan mengalokasikan akun Roblox dalam jumlah besar. Dibangun berdasarkan PRD BLOX MANAGER v1.0.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Data demo (1.204 akun, 3 grup, 144 sesi) dibuat otomatis di `data/blox.json` saat API pertama kali dipanggil.

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

## Keamanan & data

- Password dienkripsi **AES-256-GCM** sebelum disimpan (`src/lib/crypto.ts`), kunci diturunkan dari `BLOX_SECRET`.
- API tidak pernah mengembalikan ciphertext/password kecuali lewat endpoint reveal, yang selalu menulis audit trail.
- Audit trail mencatat timestamp presisi untuk setiap suspend, reveal, dan perubahan alokasi.

Untuk produksi, set `BLOX_SECRET` yang kuat dan ganti penyimpanan JSON dengan database (PostgreSQL/SQLite) — lapisan akses data terisolasi di `src/lib/store.ts`.
