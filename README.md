# StuProd

Platform produktivitas mahasiswa berbasis web dengan tema:
**"Empowering Students Through Innovative Productivity Tools"**.

## Informasi Tim

- Nama Website: `StuProd`
- Nama Tim: `StuProd Team`
- Kompetisi: `IFest #14 - Web Development Competition 2026`

## 5 Fitur Utama Produktivitas

1. `Smart Notes (ZenNotes)`: Catatan rich-text + whiteboard + ekspor PDF.
2. `Time & Task Hub`: Deadline tracker, kalender 7 hari, dan priority matrix.
3. `Deep Focus Workspace`: Sesi fokus anti-distraksi dengan statistik tanam.
4. `Habit Synergy Tracker`: Pelacakan kebiasaan harian dan evaluasi mingguan.
5. `Intelligence Dashboard`: Ringkasan performa, heatmap, radar evaluasi, dan laporan PDF.

## Fitur Pendukung

- Profil pengguna lokal.
- Pengaturan preferensi aplikasi.
- Cognitive guard (jeda napas terstruktur saat overload).
- Backup/restore data lokal (JSON).

## Teknologi

- React 19 + Vite 7
- TailwindCSS
- Framer Motion
- Chart.js + react-chartjs-2
- @hello-pangea/dnd
- html2pdf.js
- Vite PWA

## Arsitektur Penyimpanan

Seluruh data disimpan di `localStorage` browser (tanpa backend/database server).

Key utama:

- `stuprod_user`
- `stuprod_profileInfo`
- `stuprod_settings`
- `zen_pages_multi`
- `matrix_tasks`
- `stuprod_tasks`
- `time_blocks`
- `stuprod_habits_v4`
- `forest_stats`
- `stuprod_radar_scores`

## Menjalankan Proyek

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

## Deployment

Vercel
- Repository URL: `https://github.com/<username>/<repo>`
- Hosting URL: `https://<project>.vercel.app`

## Kepatuhan Rulebook (Ringkas)

- Frontend-only: Ya
- Tanpa backend framework terlarang: Ya
- Website sudah dapat di-hosting statis: Ya
- Fitur utama produktivitas: 5 fitur
- Source code + hosting link: disiapkan melalui repository dan deployment

## Catatan Presentasi Final

Untuk sesi final 10 menit presentasi + 10 menit tanya jawab:

1. Jelaskan masalah produktivitas mahasiswa yang disasar.
2. Demo alur lintas fitur dari Notes -> Matrix -> Kalender -> Dashboard.
3. Tunjukkan value desain (warna, struktur, dan alasan UX).
4. Tunjukkan reliability (autosave, local-first, backup/restore).
