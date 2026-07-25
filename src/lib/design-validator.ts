/**
 * design-validator.ts
 * ---------------------------------------------------------------
 * Validasi & auto-fix untuk `design.elements` yang dihasilkan AI
 * pada stage 3 (DESIGN ARTBOARDS) / stage 4 (POLISH) di ai_functions.ts.
 *
 * Kenapa ini perlu:
 * LLM diberi instruksi "jangan keluar kanvas / jangan tabrak footer /
 * jangan overlap teks" lewat prompt — tapi instruksi teks tidak
 * dijamin ditaati saat model men-generate puluhan koordinat sekaligus.
 * Modul ini mengecek & memperbaiki hasil secara DETERMINISTIK di
 * server, sebelum disimpan / dirender ke pptxgenjs.
 *
 * Cara pakai (lihat contoh integrasi di bagian bawah file):
 *
 *   import { fixPresentationDesign } from "./design-validator";
 *   parsed = fixPresentationDesign(parsed) as Record<string, unknown>;
 *
 * Taruh setelah stage 3 DAN setelah stage 4 (dua-duanya, karena
 * stage 4 bisa memperkenalkan elemen baru lagi).
 * ---------------------------------------------------------------
 */

// ===== Konstanta kanvas (harus sama persis dengan prompt di ai_functions.ts) =====
const CANVAS_W = 13.333;
const CANVAS_H = 7.5;
const SAFE_X_MIN = 0.4;
const SAFE_X_MAX = 12.9;
const SAFE_Y_MIN = 0.4;
const FOOTER_Y = 7.1; // tidak boleh ada elemen yang melewati y ini (kecuali footer sistem)
const MIN_W = 0.15;
const MIN_H = 0.12;

type DesignElement = {
  type: "rect" | "roundRect" | "ellipse" | "line" | "triangle" | "chevron" | "text";
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  rotate?: number;
  text?: string;
  fontSize?: number;
  fontFace?: "heading" | "body";
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  charSpacing?: number;
  [key: string]: unknown;
};

type SlideDesign = { background?: string; elements: DesignElement[] };
type Slide = { title?: string; layout?: string; design?: SlideDesign; [key: string]: unknown };

export type ValidationIssue = {
  slideIndex: number;
  elementIndex: number;
  kind:
    | "out_of_canvas"
    | "footer_collision"
    | "degenerate_size"
    | "text_overflow"
    | "text_overlap"
    | "edge_stripe"
    | "cream_background"
    | "low_contrast_text"
    | "unsafe_font";
  detail: string;
  autoFixed: boolean;
};

export type ValidationReport = {
  issues: ValidationIssue[];
  /** true kalau ada masalah yang TIDAK bisa diperbaiki otomatis dengan aman
   *  (mis. overlap parah antar 2+ text block) — sinyal untuk trigger
   *  stage "FIX" tambahan ke AI dengan daftar slide/elemen bermasalah. */
  needsAiFix: boolean;
  /** index slide yang perlu di-regenerate ulang designnya */
  slidesNeedingRegeneration: number[];
};

// ---------------------------------------------------------------
// 1. Clamp elemen ke dalam batas kanvas (hard bound, selalu jalan)
// ---------------------------------------------------------------
function clampToCanvas(el: DesignElement): { changed: boolean; before: string } {
  const before = `x${el.x},y${el.y},w${el.w},h${el.h}`;
  let changed = false;

  // Ukuran minimum supaya tidak ada elemen "titik" tak kelihatan / w,h negatif
  if (!(el.w > 0)) { el.w = MIN_W; changed = true; }
  if (!(el.h > 0)) { el.h = MIN_H; changed = true; }
  if (el.w < MIN_W) { el.w = MIN_W; changed = true; }
  if (el.h < MIN_H) { el.h = MIN_H; changed = true; }

  // Posisi tidak boleh negatif
  if (el.x < 0) { el.x = 0; changed = true; }
  if (el.y < 0) { el.y = 0; changed = true; }

  // Lebar/tinggi tidak boleh melebihi kanvas itu sendiri
  if (el.w > CANVAS_W) { el.w = CANVAS_W; changed = true; }
  if (el.h > CANVAS_H) { el.h = CANVAS_H; changed = true; }

  // Geser ke kiri/atas kalau keluar sisi kanan/bawah kanvas
  if (el.x + el.w > CANVAS_W) {
    const nx = Math.max(0, CANVAS_W - el.w);
    if (nx !== el.x) { el.x = round3(nx); changed = true; }
  }
  if (el.y + el.h > CANVAS_H) {
    const ny = Math.max(0, CANVAS_H - el.h);
    if (ny !== el.y) { el.y = round3(ny); changed = true; }
  }

  el.x = round3(el.x);
  el.y = round3(el.y);
  el.w = round3(el.w);
  el.h = round3(el.h);

  return { changed, before };
}

// ---------------------------------------------------------------
// 2. Cegah tabrakan dengan area footer (y >= 7.1)
//    Latar/dekorasi besar boleh menyentuh, tapi elemen TEXT tidak boleh.
// ---------------------------------------------------------------
function fixFooterCollision(el: DesignElement): boolean {
  if (el.type !== "text") return false; // shape latar besar boleh turun sampai bawah, tidak masalah visual
  const bottom = el.y + el.h;
  if (bottom > FOOTER_Y) {
    const overflow = bottom - FOOTER_Y;
    // Coba geser ke atas dulu; kalau mentok safe area atas, baru kecilkan tinggi
    const newY = Math.max(SAFE_Y_MIN, el.y - overflow);
    if (newY + el.h <= FOOTER_Y) {
      el.y = round3(newY);
    } else {
      el.h = round3(Math.max(MIN_H, FOOTER_Y - el.y));
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------
// 3. Estimasi overflow teks vs ukuran box (heuristik, bukan eksak)
//    Dipakai untuk MENANDAI (bukan mengubah paksa font, karena
//    mengecilkan font otomatis sering bikin tampilan tidak konsisten)
// ---------------------------------------------------------------
function estimateTextOverflow(el: DesignElement): boolean {
  if (el.type !== "text" || !el.text || !el.fontSize) return false;
  const fontPt = el.fontSize;
  // Estimasi kasar lebar rata-rata karakter ≈ 0.5 * fontSize (pt), 1pt = 1/72 inci
  const avgCharWidthIn = (fontPt * 0.5) / 72;
  const boxWidthIn = Math.max(0.1, el.w - 0.1); // sedikit padding internal
  const charsPerLine = Math.max(1, Math.floor(boxWidthIn / avgCharWidthIn));
  const lines = el.text.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  const lineHeightIn = (fontPt * 1.25) / 72;
  const requiredHeightIn = lines * lineHeightIn;
  return requiredHeightIn > el.h + 0.05; // toleransi kecil
}

// ---------------------------------------------------------------
// 4. Deteksi overlap antar elemen TEXT (bukan shape — shape memang
//    sengaja ditumpuk sebagai kartu/latar).
// ---------------------------------------------------------------
function bboxOverlapArea(a: DesignElement, b: DesignElement): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

function detectTextOverlaps(elements: DesignElement[]): Array<[number, number]> {
  const textIdx = elements
    .map((el, i) => ({ el, i }))
    .filter((x) => x.el.type === "text");
  const pairs: Array<[number, number]> = [];
  for (let a = 0; a < textIdx.length; a++) {
    for (let b = a + 1; b < textIdx.length; b++) {
      const elA = textIdx[a].el;
      const elB = textIdx[b].el;
      const overlapArea = bboxOverlapArea(elA, elB);
      const smallerArea = Math.min(elA.w * elA.h, elB.w * elB.h);
      if (smallerArea > 0 && overlapArea / smallerArea > 0.3) {
        pairs.push([textIdx[a].i, textIdx[b].i]);
      }
    }
  }
  return pairs;
}

// ---------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ---------------------------------------------------------------
// Tambahan: safe-list font, whitelist cream bg, kontras WCAG, edge stripe
// (diadaptasi dari skill PPTX Claude — lihat .agents/skills/pptx-numu)
// ---------------------------------------------------------------
const SAFE_FONTS = new Set(["heading", "body"]); // fontFace di schema kita hanya 2 nilai; kalau ada nilai lain → warn
const CREAM_BGS = new Set(["F5F5DC", "FAF0E6", "FAEBD7", "FFF8E1", "FDF6E3", "FFF5E1", "F5EFE6"]);

function normHex(v: string | undefined): string | null {
  if (!v) return null;
  const h = v.replace("#", "").trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(h) ? h : null;
}
function relLum(hex: string): number {
  const n = parseInt(hex, 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(a: string, b: string): number {
  const l1 = relLum(a);
  const l2 = relLum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// Deteksi rect tipis (stripe) menempel salah satu tepi kanvas.
function isEdgeStripe(el: DesignElement): boolean {
  if (el.type !== "rect" && el.type !== "roundRect" && el.type !== "line") return false;
  const thin = el.w < 0.18 || el.h < 0.18;
  if (!thin) return false;
  const nearLeft = el.x <= 0.15;
  const nearRight = el.x + el.w >= CANVAS_W - 0.15;
  const nearTop = el.y <= 0.15;
  const nearBottom = el.y + el.h >= CANVAS_H - 0.15;
  return nearLeft || nearRight || nearTop || nearBottom;
}

// Cari fill shape terdekat di belakang text (elemen index lebih kecil, overlap dgn text).
// Kalau tidak ada, jatuh ke slide background.
function findBackgroundFill(
  textEl: DesignElement,
  textIdx: number,
  elements: DesignElement[],
  slideBg: string | undefined,
): string {
  for (let i = textIdx - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.type === "text" || el.type === "line") continue;
    if (!el.fill) continue;
    const overlap =
      Math.min(textEl.x + textEl.w, el.x + el.w) - Math.max(textEl.x, el.x) > 0.05 &&
      Math.min(textEl.y + textEl.h, el.y + el.h) - Math.max(textEl.y, el.y) > 0.05;
    if (overlap) {
      const hex = normHex(el.fill);
      if (hex) return hex;
    }
  }
  return normHex(slideBg) ?? "FFFFFF";
}

// ---------------------------------------------------------------
// Fungsi utama: perbaiki satu slide, kembalikan issue log
// ---------------------------------------------------------------
function fixSlideDesign(slide: Slide, slideIndex: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const design = slide.design;
  if (!design || !Array.isArray(design.elements)) return issues;

  // Auto-fix cream/beige background
  const bgHex = normHex(design.background);
  if (bgHex && CREAM_BGS.has(bgHex)) {
    design.background = "FFFFFF";
    issues.push({
      slideIndex,
      elementIndex: -1,
      kind: "cream_background",
      detail: `Latar slide cream/beige "${bgHex}" diganti ke FFFFFF (larangan default AI).`,
      autoFixed: true,
    });
  }

  design.elements.forEach((el, elementIndex) => {
    const { changed, before } = clampToCanvas(el);
    if (changed) {
      issues.push({
        slideIndex,
        elementIndex,
        kind: "out_of_canvas",
        detail: `Elemen ${el.type} keluar/melebihi kanvas (${before}) -> di-clamp ke x${el.x},y${el.y},w${el.w},h${el.h}`,
        autoFixed: true,
      });
    }

    const footerFixed = fixFooterCollision(el);
    if (footerFixed) {
      issues.push({
        slideIndex,
        elementIndex,
        kind: "footer_collision",
        detail: `Elemen text menabrak area footer (y>=${FOOTER_Y}), digeser/diperkecil.`,
        autoFixed: true,
      });
    }

    // Edge stripe: rect tipis menempel tepi = ciri filler AI. Tandai (autoFix=false)
    // supaya AI stage FIX yang menggantinya dengan solusi visual lebih baik.
    if (isEdgeStripe(el)) {
      issues.push({
        slideIndex,
        elementIndex,
        kind: "edge_stripe",
        detail: `${el.type} tipis (${el.w}x${el.h}in) menempel tepi kanvas — dilarang (edge stripe generik AI). Ganti dengan whitespace, kartu, atau icon.`,
        autoFixed: false,
      });
    }

    // Font unsafe (fontFace di luar 'heading'/'body') → autofix ke 'body'
    if (el.type === "text" && el.fontFace && !SAFE_FONTS.has(el.fontFace)) {
      el.fontFace = "body";
      issues.push({
        slideIndex,
        elementIndex,
        kind: "unsafe_font",
        detail: `fontFace "${el.fontFace}" tidak dikenal → di-fallback ke 'body'.`,
        autoFixed: true,
      });
    }

    // Kontras teks vs latar terdekat
    if (el.type === "text" && el.text && el.color) {
      const textHex = normHex(el.color);
      if (textHex) {
        const bg = findBackgroundFill(el, elementIndex, design.elements, design.background);
        const ratio = contrast(textHex, bg);
        if (ratio < 4.5) {
          issues.push({
            slideIndex,
            elementIndex,
            kind: "low_contrast_text",
            detail: `Text "${el.text.slice(0, 30)}..." warna #${textHex} vs latar #${bg} kontras ${ratio.toFixed(2)}:1 (< 4.5 WCAG AA). Ubah warna teks atau latar.`,
            autoFixed: false,
          });
        }
      }
    }

    if (estimateTextOverflow(el)) {
      issues.push({
        slideIndex,
        elementIndex,
        kind: "text_overflow",
        detail: `Perkiraan teks "${(el.text ?? "").slice(0, 40)}..." tidak muat di box ${el.w}x${el.h}in pada fontSize ${el.fontSize}pt.`,
        autoFixed: false, // tidak auto-diubah — ditandai untuk fix stage AI atau font-autosize saat render
      });
    }
  });

  const overlaps = detectTextOverlaps(design.elements);
  for (const [i, j] of overlaps) {
    issues.push({
      slideIndex,
      elementIndex: i,
      kind: "text_overlap",
      detail: `Elemen text #${i} tumpang tindih signifikan dengan elemen text #${j}.`,
      autoFixed: false,
    });
  }

  return issues;
}

// ---------------------------------------------------------------
// Entry point: perbaiki seluruh presentasi + kembalikan laporan
// ---------------------------------------------------------------
export function fixPresentationDesign(parsed: Record<string, unknown>): {
  fixed: Record<string, unknown>;
  report: ValidationReport;
} {
  const slides = (parsed.slides as Slide[] | undefined) ?? [];
  const allIssues: ValidationIssue[] = [];
  const slidesNeedingRegeneration = new Set<number>();

  slides.forEach((slide, idx) => {
    const issues = fixSlideDesign(slide, idx);
    allIssues.push(...issues);
    // Kalau ada overlap parah atau overflow yang tidak auto-fixable, tandai slide ini
    if (issues.some((i) => !i.autoFixed)) {
      slidesNeedingRegeneration.add(idx);
    }
  });

  const report: ValidationReport = {
    issues: allIssues,
    needsAiFix: slidesNeedingRegeneration.size > 0,
    slidesNeedingRegeneration: Array.from(slidesNeedingRegeneration).sort((a, b) => a - b),
  };

  return { fixed: parsed, report };
}

// ---------------------------------------------------------------
// Helper: bangun instruksi "FIX" yang presisi untuk dikirim balik
// ke AI (stage tambahan), hanya menyebut slide/elemen bermasalah —
// jauh lebih efektif daripada instruksi umum "jangan overlap".
// ---------------------------------------------------------------
export function buildAiFixInstruction(report: ValidationReport, parsed: Record<string, unknown>): string {
  if (!report.needsAiFix) return "";
  const slides = (parsed.slides as Slide[] | undefined) ?? [];
  const lines: string[] = [
    "STAGE FIX (WAJIB): Beberapa slide punya masalah layout spesifik berikut. " +
      "Perbaiki HANYA 'design.elements' pada slide yang disebut, jangan ubah slide lain, jangan ubah teks/konten:",
  ];
  for (const idx of report.slidesNeedingRegeneration) {
    const slideIssues = report.issues.filter((i) => i.slideIndex === idx && !i.autoFixed);
    const title = slides[idx]?.title ?? `Slide ${idx + 1}`;
    lines.push(`\nSlide ${idx + 1} ("${title}"):`);
    for (const issue of slideIssues) {
      lines.push(`  - [elemen #${issue.elementIndex}] ${issue.kind}: ${issue.detail}`);
    }
  }
  lines.push(
    "\nUntuk 'text_overlap': geser salah satu elemen (biasanya yang datang belakangan) supaya tidak tumpang tindih >30% area, atau perkecil salah satu box.",
    "Untuk 'text_overflow': perbesar box (w/h) ATAU perkecil fontSize secukupnya supaya teks muat.",
    "Untuk 'edge_stripe': HAPUS elemen stripe tipis di pinggir kanvas. Bila kamu ingin menandai area, pakai roundRect fill=accentSoft (kartu) atau ikon dalam ellipse — jangan garis tipis menempel tepi.",
    "Untuk 'low_contrast_text': ubah color teks agar kontras ≥ 4.5:1 terhadap latarnya (mis. teks di atas bg gelap pakai FFFFFF; di atas surface terang pakai theme.ink).",
  );
  return lines.join("\n");
}

/**
 * ---------------------------------------------------------------
 * CONTOH INTEGRASI di ai_functions.ts
 * ---------------------------------------------------------------
 *
 * import { fixPresentationDesign, buildAiFixInstruction } from "./design-validator";
 *
 * for (const stage of [1, 2, 3, 4] as const) {
 *   const stageMsg = stageInstruction(stage, parsed);
 *   const messages: ChatMsg[] = [...baseMessages, { role: "user", content: stageMsg }];
 *   parsed = await callGatewayTool(messages);
 *
 *   // Jalankan validator setelah stage desain (3) dan polish (4)
 *   if (!isPaper && (stage === 3 || stage === 4)) {
 *     const { fixed, report } = fixPresentationDesign(parsed);
 *     parsed = fixed;
 *     console.log(`[design-validator] stage ${stage}:`, report.issues.length, "issue(s),",
 *       report.needsAiFix ? `${report.slidesNeedingRegeneration.length} slide perlu fix AI` : "aman");
 *
 *     // Kalau stage 4 (final) masih ada masalah yang tidak auto-fixable,
 *     // lakukan SATU panggilan tambahan yang presisi (bukan re-run stage 4 penuh)
 *     if (stage === 4 && report.needsAiFix) {
 *       const fixMsg = buildAiFixInstruction(report, parsed);
 *       const fixMessages: ChatMsg[] = [...baseMessages, { role: "user", content: fixMsg }];
 *       parsed = await callGatewayTool(fixMessages);
 *       // validasi ulang sekali lagi (hard clamp tetap jalan sebagai jaring pengaman terakhir)
 *       parsed = fixPresentationDesign(parsed).fixed;
 *     }
 *   }
 * }
 * ---------------------------------------------------------------
 */
