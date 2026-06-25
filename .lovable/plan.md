## Masalah
Saat ini `buildDocx` di `src/lib/export.functions.ts` hanya menulis paragraf bold biasa (Calibri, ukuran acak) — bukan **heading style asli Word**. Akibatnya:
- Tidak ada hierarki Heading 1/2/3 → Navigation Pane & daftar isi otomatis Word tidak jalan.
- Font default Calibri, bukan Times New Roman 12pt seperti standar makalah Indonesia.
- AI hanya menghasilkan `sections[].paragraphs[]` flat — tidak ada sub-bab (1.1, 1.2), padahal makalah biasanya BAB I Pendahuluan → 1.1 Latar Belakang, 1.2 Rumusan Masalah, dst.

## Rencana Perbaikan

### 1. Upgrade skema AI (`src/lib/ai.functions.ts`)
Ubah `paperTool` agar tiap section punya **subsections opsional**:
```
sections[]: { heading, paragraphs[], subsections?: [{ heading, paragraphs[] }] }
```
Prompt diperbarui untuk mengikuti struktur makalah standar:
- BAB I Pendahuluan (1.1 Latar Belakang, 1.2 Rumusan Masalah, 1.3 Tujuan)
- BAB II Pembahasan (sub-bab sesuai topik)
- BAB III Penutup (3.1 Kesimpulan, 3.2 Saran)

### 2. Rewrite `buildDocx` dengan style asli Word
- **Default font**: Times New Roman 12pt (size: 24 half-points), spasi 1.5 (line: 360), justify.
- **Heading 1** (BAB): TNR 14pt bold, center, uppercase, spasi before/after.
- **Heading 2** (sub-bab 1.1): TNR 12pt bold, left.
- **Heading 3** (sub-sub-bab): TNR 12pt bold italic.
- Pakai `Document.styles.paragraphStyles` dengan id `"Heading1"`, `"Heading2"`, `"Heading3"` + `outlineLevel` agar Navigation Pane & TOC bisa membaca.
- Paragraf body pakai `HeadingLevel.HEADING_1/2/3` (bukan TextRun bold manual) supaya benar-benar terdaftar sebagai heading.
- Margin standar makalah: kiri 4cm, atas/kanan/bawah 3cm.
- Indent paragraf pertama (firstLine: 720 = 0.5").

### 3. Cover & daftar pustaka
- Cover tetap center, judul TNR 14pt bold uppercase, info mahasiswa TNR 12pt.
- Abstrak: heading 1 "ABSTRAK", body italic.
- Daftar Pustaka: heading 1, item dengan hanging indent (sudah ada, ganti ke TNR 12pt).

### 4. File yang disentuh
- `src/lib/ai.functions.ts` — skema + prompt subsections.
- `src/lib/export.functions.ts` — `buildDocx` lengkap pakai Word heading styles + TNR.
- Tidak menyentuh PPT, UI, login, atau bagian lain.

## Catatan
Konten lama yang sudah ter-generate (tanpa subsections) tetap kompatibel — builder fallback render section sebagai Heading 1 + paragraf saja jika `subsections` kosong.
