## Stack Baru untuk PPT

**Model AI**: `google/gemini-3.6-flash` (via Lovable Gateway — sudah aktif, tidak perlu key baru).
**Pencarian visual**: Unsplash API — butuh 1 secret baru dari user (`UNSPLASH_ACCESS_KEY`).
**Rendering slide**: HTML5 + CSS3 (Grid/Flexbox) di dalam sandboxed iframe.
**Tipografi**: Plus Jakarta Sans (body) + Space Grotesk (display) via Google Fonts.
**Ikon**: Font Awesome 6 (via CDN).
**Rumus**: MathML native (browser support langsung, tanpa lib tambahan).

## Perubahan File

### 1. `src/lib/ai.functions.ts` — Ganti schema PPT
Buang schema `design.elements` (koordinat inci pptxgenjs). Ganti jadi:
```ts
presentation: {
  meta: { title, subtitle, palette: { primary, accent, bg, ink, muted } },
  slides: [{
    kind: "cover" | "content" | "quote" | "stats" | "closing",
    html: string,          // fragment HTML lengkap slide (inline styles OK)
    imageQuery?: string,   // query Unsplash, mis. "quantum computing"
    notes: string
  }]
}
```
Prompt Gemini: "You are a senior web designer. Return semantic HTML with inline CSS Grid/Flexbox. Gunakan class `.slide` root 1280×720 px. Font Awesome via `<i class='fa-solid fa-*'>`. Rumus dalam `<math>...</math>`. Sertakan `imageQuery` bila slide butuh foto."

### 2. `src/lib/unsplash.functions.ts` — BARU
```ts
searchUnsplash({ query }) → { url, alt, credit }
```
Server function pakai `process.env.UNSPLASH_ACCESS_KEY`. Setelah AI generate, loop `slides[]` yang punya `imageQuery`, resolve jadi `imageUrl`, inject ke HTML sebagai `<img src="...">`.

### 3. `src/lib/export.functions.ts` — Rewrite total PPT part
- Hapus semua template pptxgenjs (`buildPptx`, cover templates, dsb) — sisakan DOCX untuk makalah.
- Server function baru `generatePresentation` = generate + resolve gambar + simpan array `slides[]` ke `projects.content`.

### 4. `src/components/SlideViewer.tsx` — BARU
Komponen preview: render tiap slide di `<iframe sandbox>` dengan boilerplate HTML (font, FA, reset CSS) + HTML fragment dari AI. Navigasi prev/next, thumbnail strip.

### 5. `src/components/DownloadPptxButton.tsx` — BARU
Client-side rendering ke PPTX:
- Loop tiap slide → render di offscreen iframe → `html2canvas` → PNG base64.
- Build `.pptx` pakai `pptxgenjs` (sudah installed) dengan satu full-bleed image per slide + speaker notes.
- Fidelity 100% karena setiap slide jadi gambar.

### 6. `src/routes/_authenticated/mission.$id.tsx` — Ganti tampilan hasil PPT
Untuk mission type presentation: tampilkan `<SlideViewer />` + `<DownloadPptxButton />`. Untuk paper: tetap seperti sekarang.

## Yang Dibuang
- File `src/lib/pptx-templates.ts`
- File `src/lib/design-validator.ts`
- `.agents/skills/pptx-numu/SKILL.md` (aturan koordinat sudah tidak relevan)
- Semua fungsi `buildPptx`, `renderCover*`, `renderSection*` di `export.functions.ts`
- Stage design/polish/fix di prompt PPT

## Yang Butuh User
Saya akan minta `UNSPLASH_ACCESS_KEY` via `add_secret` di langkah terakhir setelah kode siap. User ambil di https://unsplash.com/developers (Create app → copy Access Key, gratis 50 req/jam).

## Catatan Fungsi yang Dipertahankan
- Alur DOCX makalah, quota, auth, dashboard, projects — tidak disentuh.
- `pptxgenjs` masih dipakai (di client) untuk assembly PPTX dari screenshot HTML.

## Estimasi
5 file baru/rewrite, 3 file dihapus. Testing manual di preview setelah user isi secret.