---
name: pptx-numu
description: Aturan desain & rendering PPTX untuk generator presentasi Numu AI (Gemini + pptxgenjs). Diadaptasi dari skill PPTX Claude. Panduan bagi prompt AI, renderer `src/lib/export.functions.ts`, dan validator `src/lib/design-validator.ts`. Muat skill ini setiap kali menyentuh alur generate/edit/QA presentasi.
---

# PPTX Numu AI — Design & Render Rules

Sumber kebenaran untuk kualitas PPT. Terdiri dari (A) aturan desain yang harus tercermin di prompt Gemini, (B) footgun pptxgenjs yang wajib dihindari renderer, (C) safe-list font & ukuran, (D) invariants yang dipaksakan oleh `design-validator.ts`.

## A. Aturan desain (untuk prompt AI)

- Kanvas: `LAYOUT_WIDE` 13.333 × 7.5 inci. Safe area x ∈ [0.4, 12.9], y ∈ [0.4, 7.1]. Zona footer y ≥ 7.15.
- Palet **harus informed by topic** — jangan default biru. Satu warna dominan 60–70%, 1–2 pendukung, 1 aksen tajam. Gelap-terang sandwich: cover & closing gelap, konten terang.
- Motif konsisten: pilih SATU elemen distinctive (icon dalam lingkaran berwarna, hero frame bulat, dsb) dan ulang tiap slide. Jangan pakai color-bar/accent-stripe sebagai motif.
- Setiap slide punya elemen visual (shape/icon/chart/kartu). **Tidak boleh** slide title+bullets polos.
- Variasi layout antar slide: two-column, icon+text rows, 2×2 grid, half-bleed, stat callout, timeline. Jangan 2 slide berturut komposisi identik.
- Hierarki: title 36–44 bold · section header 20–24 bold · body 14–16 · caption 10–12 muted · stat 60–96.
- Body text left-align. Hanya title yang center. Kontras teks WCAG AA (≥ 4.5:1).
- Margin dari tepi ≥ 0.5", gap antar blok 0.3–0.5" konsisten.

### LARANGAN KERAS (ciri khas AI slide generik)

- ❌ **Accent line di bawah judul** — hallmark AI. Pakai whitespace / warna latar.
- ❌ **Decorative color bar / accent stripe** — header bar full-width, sidebar vertical stripe, thin edge stripe di kartu, single-side border. Pakai tint latar / drop-shadow / icon.
- ❌ **Background cream / beige default** (F5F5DC, FAF0E6, FAEBD7, FFF8E1). Default putih atau warna brand.
- ❌ **Teks overflow** dari container. Kalau tidak muat: kecilkan font, split slide, atau perbesar container.
- ❌ **Text-only slide** (title + bullets tanpa visual).
- ❌ Font default "Aptos" — substitusi tidak konsisten.

## B. pptxgenjs footguns (untuk renderer)

- `pres.layout = "LAYOUT_WIDE"` **sebelum** `addSlide()`.
- Hex color **tanpa `#`**, 6 digit. Jangan 8-digit (alpha). Transparansi pakai `transparency: 0-100` di fill/image, atau `opacity: 0-1` di shadow — bukan alpha di hex.
- Jangan share object opsi antar dua `add*` call — pptxgenjs mutasi in-place ke EMU. Selalu bikin objek baru.
- Shadow offset harus ≥ 0. Untuk bayangan ke atas pakai `angle: 270` + offset positif.
- `letterSpacing` **diam-diam diabaikan** — pakai `charSpacing`.
- Bullet: `bullet: true` per item; **jangan** karakter `•` literal (double bullet). Antar item `breakLine: true`. Jarak antar bullet pakai `paraSpaceAfter`, bukan `lineSpacing`.
- Satu `new pptxgen()` per output file.
- `rectRadius` hanya di `ROUNDED_RECTANGLE`, tidak di `RECTANGLE`.
- Gradient fill tidak didukung — pakai image gradient sebagai background.
- Text box punya internal padding — **set `margin: 0`** jika teks harus align presisi dengan shape/line di posisi x sama.
- Speaker notes via `slide.addNotes("...")`, bukan text box di slide.
- Speaker notes **plain text sekali per slide** (tidak dua kali).
- Stacked bar/column: `dataLabelPosition` harus `ctr` / `inEnd` / `inBase`. `outEnd` corrupts file.
- Combo dengan secondary axis butuh dua entri di `valAxes` & `catAxes`.

## C. Safe font list

Font ditulis ke `.pptx` dan dirender oleh PowerPoint user. Substitusi bisa berbeda width dari font asli. Untuk QA yang reliable, batasi ke:

| Aman (width-safe) | Calibri, Arial, Cambria, Times New Roman, Courier New, Bookman Old Style, Century Schoolbook |
| Boleh untuk header | Cambria, Bookman Old Style, Century Schoolbook (serif dengan karakter) |
| **Hindari** (substitusi lebar berbeda) | Georgia, Trebuchet MS, Impact, Arial Black, Garamond, Consolas, Palatino Linotype, Aptos |

Renderer wajib substitusi otomatis kalau font di theme di luar safe list → fallback ke `Calibri`.

## D. Invariants yang dipaksakan validator

`src/lib/design-validator.ts` men-scan `design.elements` tiap slide dan menghasilkan `issues[]`. Auto-fixable diperbaiki langsung; sisanya di-forward ke AI sebagai stage FIX.

| Kind | Auto-fix | Aturan |
|------|----------|--------|
| `out_of_canvas` | ya | Clamp x/y/w/h ke [0, kanvas]. |
| `footer_collision` | ya | Text tidak boleh y+h > 7.1. |
| `degenerate_size` | ya | w,h ≥ 0.15 × 0.12. |
| `text_overflow` | tidak | Estimasi (charsPerLine × lines) vs tinggi box. |
| `text_overlap` | tidak | Overlap area >30% antar text box. |
| `edge_stripe` | tidak | Rect ramping (w atau h < 0.18) menempel di salah satu tepi slide. Ciri filler AI. |
| `cream_background` | ya | Warna latar dalam whitelist cream/beige → di-swap ke `FFFFFF`. |
| `low_contrast_text` | tidak | Rasio kontras text.color vs latar terdekat < 4.5. |
| `unsafe_font` | ya | fontFace di luar safe list → substitusi Calibri. |

## E. Alur ideal generate presentasi

1. Stage 1 DRAFT: outline + blocks.
2. Stage 2 EXPAND: perluas narasi.
3. Stage 3 DESIGN: isi `design.elements` per slide (8–20 elemen).  
   → `fixPresentationDesign()` clamp keras + collect issues.
4. Stage 4 POLISH: variasi komposisi, notes.  
   → validator ulang; jika masih ada issue non-auto-fixable, kirim `buildAiFixInstruction()` presisi (sebut slide & elemen). Terakhir clamp keras.

## F. QA manual (opsional, bila user minta cek)

- Ekstrak teks: gunakan reader PPTX.
- Render preview: LibreOffice → PDF → jpg tiap slide.
- Cek: overflow teks, overlap, gap < 0.3", margin tepi < 0.5", low-contrast, leftover placeholder ("XXXX", "Lorem", "[insert]").

---
Sumber orisinal: skill PPTX Anthropic Claude. Adaptasi untuk stack Numu AI (Gemini via Lovable Gateway + pptxgenjs, output DOCX/PPTX untuk mahasiswa Indonesia).