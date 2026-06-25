# Student OS — Design Pass (v0)

Tujuannya: validasi arah visual & alur navigasi sebelum kita pasang AI generation, .docx/.pptx export, dan database. Semua data masih mock; tombol Download dan generation cuma simulasi animasi progres.

## Arah Desain

- **Mood**: Notion × Linear × Apple. Tenang, akademik, premium, banyak white space.
- **Background** `#FAFAFA`, **Text** `#0F172A` / `#64748B`, **Accent** `#2563EB`, status `#22C55E` / `#FB923C` / `#EF4444`.
- **Tipografi**: Plus Jakarta Sans (display + body), bobot 400/500/600/700. Heading besar, line-height longgar.
- **Komponen**: sudut rounded-2xl, border `#E2E8F0`, shadow lembut (`0 1px 2px rgba(15,23,42,0.04)`).
- **Ikon**: Lucide, outline only. Tidak ada ilustrasi 3D / robot / gradien neon ungu.
- **Bahasa UI**: Bahasa Indonesia.
- **Motion**: fade/slide halus (150–250ms), checklist animasi saat "AI bekerja".

## Halaman yang Dibangun

1. **`/auth`** — Login & Sign Up (mock)
   - Card tengah, logo "Student OS", tab Masuk / Daftar.
   - Field email + password, tombol "Lanjutkan dengan Google" (visual saja).
   - Submit langsung redirect ke `/` (state auth disimpan di localStorage untuk demo).

2. **`/` Home**
   - Header minimal: logo kiri, nav (Beranda · Proyek · Profil), avatar kanan.
   - Hero: judul besar "Mau menyelesaikan apa hari ini?"
   - Dua Mission Card berdampingan:
     - 📄 **Selesaikan Paper** — "Estimasi 15 menit" — tombol *Mulai Misi*
     - 📊 **Buat Presentasi** — "Estimasi 10 menit" — tombol *Mulai Misi*
   - Section **Proyek Terbaru**: 3 kartu mock dengan progres bar + tombol *Lanjutkan*.

3. **`/projects`** — Daftar Proyek
   - Tab: Semua · Sedang Berjalan · Selesai.
   - List/grid kartu: nama proyek, jenis misi, progres %, tanggal, tombol *Lanjutkan* atau *Unduh*.

4. **`/mission/:id` — Workspace** (satu layout dipakai Paper & Presentasi)
   - **Top bar**: judul misi, progres bar besar, "Sisa waktu ±10 menit", tombol Unduh (disabled sampai 100%).
   - **Kiri (40%)**: panel "Asisten" — AI mengajukan 3–5 pertanyaan adaptif satu per satu (mock: topik → mata kuliah → panjang → gaya → bahasa). Bubble pertanyaan + input jawaban + tombol Lanjut.
   - **Kanan (60%)**: panel Preview kosong → berubah jadi outline → konten → file final saat progres jalan.
   - **Footer**: status AI dengan checklist animasi:
     - ✓ Memahami tugas
     - ✓ Menyusun struktur
     - ⏳ Menulis pendahuluan…
     - ◻ Membangun pembahasan
     - ◻ Menyusun referensi
     - ◻ Memformat dokumen
   - Setelah pertanyaan selesai, klik *Mulai Kerjakan* → progres jalan otomatis (simulasi 8–12 detik) → tombol Unduh aktif (mock toast "Unduhan dimulai").

5. **`/profile`** — Halaman profil sederhana (avatar, nama, email mock, tombol Keluar).

## Struktur Teknis (TanStack Start)

- Route files baru:
  - `src/routes/auth.tsx`
  - `src/routes/index.tsx` (replace placeholder)
  - `src/routes/projects.tsx`
  - `src/routes/mission.$id.tsx`
  - `src/routes/profile.tsx`
- Komponen reusable di `src/components/`:
  - `AppHeader.tsx`, `MissionCard.tsx`, `ProjectCard.tsx`, `ProgressBar.tsx`, `AssistantPanel.tsx`, `PreviewPanel.tsx`, `AIStatusChecklist.tsx`.
- Mock data + state di `src/lib/mock-data.ts` dan Zustand-less React state (useState/useReducer). Tidak ada DB / server function.
- Auth: tombol di `/auth` hanya set `localStorage.studentos_user` lalu navigate. Belum ada gate route — semua publik untuk demo. Login asli (Cloud + Google) menyusul di fase berikutnya.
- Tipografi via `@fontsource/plus-jakarta-sans` (install lewat bun add), import di `src/router.tsx`.
- Design tokens di `src/styles.css` (`@theme` Tailwind v4) untuk warna & radius.

## Yang TIDAK Termasuk di Pass Ini

- Login asli, Lovable Cloud, tabel database, RLS.
- Panggilan AI sungguhan (Lovable AI Gateway).
- Generate `.docx` / `.pptx` betulan.
- Auto-save, AI memory persisten, resume project lintas device.
- Mission selain Paper & Presentasi.

Semua hal di atas dirancang agar mudah dipasang di iterasi berikutnya tanpa membongkar UI.

## Setelah Approval

Setelah kamu setujui pass ini, urutan berikutnya yang aku usulkan:
1. Aktifkan Lovable Cloud + auth email/Google (sesuai PRD: login wajib).
2. Pasang Lovable AI Gateway untuk Q&A adaptif + generasi konten.
3. Integrasi skill `docx` & `pptx` untuk produksi file final.
4. Persistensi proyek, auto-save, AI memory.