## Masalah

Preview merender fragmen `html` dari AI (iframe 1280×720, Font Awesome, Unsplash, layout bebas). Download `.pptx` mengabaikan `html` itu dan menggambar ulang dari field `structured` pakai renderer statis (7 layout, palette FALLBACK navy-gold). Hasilnya berbeda desain, warna, tipografi, ikon, dan komposisi — hanya teks yang sama.

## Solusi: Hybrid (background image + text box editable)

Setiap slide di `.pptx` dibangun dua lapis:

1. **Lapisan bawah (visual)** — snapshot HTML preview via `html2canvas` @ scale 2 → PNG full-bleed 13.333×7.5". Menjaga warna, ikon FA, gambar Unsplash, dekorasi, tipografi persis seperti preview.
2. **Lapisan atas (editable)** — text box pptxgenjs transparan (`fill:none`, `line:none`) diposisikan tepat di atas teks utama, isinya dari `structured` (title, subtitle, paragraphs, bullets, stats, quote, columns). Font di-set ke keluarga yang sama dengan HTML (Plus Jakarta Sans / Space Grotesk) dengan fallback safe-list (Calibri) via validator.

User dapat: (a) melihat hasil persis seperti preview saat dibuka di PowerPoint, (b) klik teks utama dan mengeditnya — perubahan menimpa gambar di posisi yang sama.

## Perubahan file

### 1. `src/lib/ai.functions.ts`
Tambah ke schema `structured` field `regions` opsional per slide:
```ts
regions?: {
  title?:    { x:number; y:number; w:number; h:number; fontSize:number; color:string; align?:"left"|"center"|"right"; bold?:boolean };
  subtitle?: { ...sama }
  body?:     { ...sama }  // untuk paragraphs+bullets gabungan
  stats?:    Array<{ x,y,w,h, valueFontSize, labelFontSize, color }>
  quote?:    { ...text region }
  columns?:  Array<{ x,y,w,h, fontSize, color }>
}
```
Update system prompt: minta AI mengisi `regions` dengan koordinat inci (kanvas 13.333×7.5) yang **cocok dengan posisi teks di `html`**-nya. AI sudah tahu layout HTML-nya sendiri, jadi dia yang paling tahu koordinat tepatnya.

### 2. `src/components/DownloadPptxButton.tsx` — rewrite
Hapus semua `renderCover/renderAgenda/renderContent/...` renderer lama. Ganti dengan flow tunggal:

```
untuk tiap slide:
  1. Bangun iframe off-screen 1280×720 dengan srcDoc = buildSlideSrcDoc(slide.html)
  2. Tunggu fonts.ready + semua image decode (crossOrigin=anonymous)
  3. html2canvas(iframe.body, {scale:2, useCORS:true, backgroundColor:null})
  4. addImage({data: png, x:0, y:0, w:13.333, h:7.5})
  5. Untuk tiap region di structured.regions:
     - addText(teks, {x,y,w,h, fontFace, fontSize, color, fill:{type:"none"}, ...})
     - Kalau region.body → gabung paragraphs + bullets dengan breakLine + bullet:true
  6. addNotes(slide.notes) jika ada
```

Import `buildSlideSrcDoc` dari `ContentPreview.tsx` (export sudah ada) supaya iframe pptx-builder identik dengan iframe preview → snapshot pasti sama dengan yang dilihat user.

Pertahankan prefetch Unsplash & cache. Pertahankan palette prop untuk fallback text color kalau AI tidak isi `regions`.

### 3. `src/components/ContentPreview.tsx`
Tidak berubah fungsional. Sudah export `buildSlideSrcDoc` — hanya pastikan tetap di-export.

### 4. `src/routes/_authenticated/mission.$id.tsx`
Tidak berubah — sudah pass `slides`, `meta`, `palette` ke `DownloadPptxButton`.

### 5. `src/lib/design-validator.ts`
Tambah pass ringan untuk `structured.regions`: clamp koordinat ke safe area, substitusi font ke safe list. Tidak wajib untuk pass pertama — bisa iterasi kedua.

## Fallback berlapis

- Slide tanpa `regions` → text box editable di-skip, hanya background image (visual persis, tidak editable). User tetap dapat hasil visual yang benar.
- Slide tanpa `html` (data lama) → fallback ke renderer lama (satu path minimal: cover/content) sehingga tidak crash.
- Gambar Unsplash yang gagal di-fetch → snapshot tetap jalan tanpa gambar tersebut.

## Detail teknis

- `html2canvas` sudah ada di dependency (dipakai versi sebelumnya). Kalau tidak ada di `package.json` sekarang, add.
- Iframe off-screen: `position:fixed; left:-99999px; width:1280px; height:720px` supaya font metrics identik dengan preview (bukan iframe di-scale).
- Untuk transparansi text-over-image di pptxgenjs: `fill: { type: "none" }` + tidak set `color` di shape (hanya `addText` tanpa background).
- pptxgenjs text box padding default ≈ 0.1" — set `margin: 0` di semua region agar teks pas menutupi teks gambar di bawahnya.
- Cross-origin: Unsplash mengizinkan CORS; Font Awesome CDN & Google Fonts di iframe di-load ulang untuk tiap iframe (cache browser membantu).

## Trade-off yang diterima

- File `.pptx` lebih besar (~200-500KB/slide karena PNG resolusi 2×).
- Kalau user mengedit teks utama, teks di background image tetap ada di bawahnya. **Mitigasi**: text box editable diberi `fill: { color: "FFFFFF" }` opaque hanya untuk region body/paragraphs/bullets, sementara title/quote tetap transparan (karena title biasanya di area warna solid yang cocok). Alternatif: solid fill pakai warna latar terdekat yang AI kirim di `regions.body.bgColor`.

## QA

Verifikasi lewat 2 mission: satu deck 4 slide (cover/content/stats/closing) dan satu deck 8 slide (mix agenda/two_column/quote). Buka `.pptx` di PowerPoint web + Google Slides, cek:
1. Slide terlihat identik dengan preview.
2. Klik title/body → bisa edit teks.
3. Notes muncul.

Tidak akan restart dev server; perubahan hanya frontend + AI prompt.
