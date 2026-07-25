// ============================================================================
// SHARED SLIDE RENDERER
// Layout renderer independen dari backend output. Adapter pattern memastikan
// PPTX (pptxgenjs) dan PDF (jsPDF) dibangun dari fungsi renderer yang sama,
// sehingga preview struktural, .pptx, dan .pdf konsisten satu-sama-lain.
// Semua koordinat dalam INCH pada canvas 13.333 × 7.5 (16:9).
// ============================================================================

export type Palette = {
  primary?: string;
  accent?: string;
  bg?: string;
  ink?: string;
  muted?: string;
};

export type Structured = {
  layout: "cover" | "agenda" | "content" | "two_column" | "stats" | "quote" | "closing";
  kicker?: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  columns?: { heading?: string; items: string[] }[];
  stats?: { value: string; label: string }[];
  quote?: { text: string; author?: string };
  footer?: string;
};

export type SlideInput = {
  notes?: string;
  imageUrl?: string;
  imageCredit?: string;
  structured?: Structured;
};

export const FALLBACK_PALETTE: Required<Palette> = {
  primary: "0B2545",
  accent: "C9A227",
  bg: "0B2545",
  ink: "10151F",
  muted: "5C6470",
};

export const FONT_HEAD = "Space Grotesk";
export const FONT_BODY = "Plus Jakarta Sans";

export const CANVAS_W = 13.333;
export const CANVAS_H = 7.5;

const hex = (c: string | undefined, fallback: string) => {
  const v = (c ?? fallback).replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : fallback;
};

export function normalizePalette(p?: Palette): Required<Palette> {
  return {
    primary: hex(p?.primary, FALLBACK_PALETTE.primary),
    accent: hex(p?.accent, FALLBACK_PALETTE.accent),
    bg: hex(p?.bg, FALLBACK_PALETTE.bg),
    ink: hex(p?.ink, FALLBACK_PALETTE.ink),
    muted: hex(p?.muted, FALLBACK_PALETTE.muted),
  };
}

export async function fetchImageAsData(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ADAPTER INTERFACE
// ---------------------------------------------------------------------------

export type TextOpts = {
  x: number;
  y: number;
  w: number;
  h: number;
  fontFace: string;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  color: string; // hex tanpa #
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  charSpacing?: number;
  paraSpaceAfter?: number;
};

export type BulletItem = string;

export interface SlideAdapter {
  setBackground(color: string): void;
  addRect(o: {
    x: number; y: number; w: number; h: number;
    fillHex?: string; transparency?: number;
    lineHex?: string; lineWidth?: number;
  }): void;
  addEllipse(o: { x: number; y: number; w: number; h: number; fillHex: string }): void;
  addImage(o: { data: string; x: number; y: number; w: number; h: number; cover?: boolean }): void;
  addText(text: string, o: TextOpts): void;
  addBullets(items: BulletItem[], o: TextOpts): void;
}

// ---------------------------------------------------------------------------
// LAYOUT RENDERERS — hanya bicara ke adapter, tidak ke library eksternal.
// ---------------------------------------------------------------------------

function renderCover(a: SlideAdapter, s: Structured, p: Required<Palette>, imgData: string | null) {
  a.setBackground(p.bg);
  if (imgData) {
    a.addImage({ data: imgData, x: 0, y: 0, w: CANVAS_W, h: CANVAS_H, cover: true });
    a.addRect({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H, fillHex: p.bg, transparency: 30 });
  }
  a.addRect({ x: 0.5, y: 1.0, w: 0.08, h: 1.6, fillHex: p.accent });
  if (s.kicker) {
    a.addText(s.kicker.toUpperCase(), {
      x: 0.8, y: 1.0, w: 12, h: 0.5,
      fontFace: FONT_BODY, fontSize: 14, bold: true, charSpacing: 4, color: p.accent,
    });
  }
  a.addText(s.title, {
    x: 0.8, y: 1.6, w: 11.5, h: 3.5,
    fontFace: FONT_HEAD, fontSize: 54, bold: true, color: "FFFFFF", valign: "top",
  });
  if (s.subtitle) {
    a.addText(s.subtitle, {
      x: 0.8, y: 5.4, w: 11.5, h: 1.0,
      fontFace: FONT_BODY, fontSize: 20, color: "E5E7EB",
    });
  }
  if (s.footer) {
    a.addText(s.footer, {
      x: 0.8, y: 6.9, w: 11.5, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, color: "9AA5B4",
    });
  }
}

function renderClosing(a: SlideAdapter, s: Structured, p: Required<Palette>, imgData: string | null) {
  a.setBackground(p.bg);
  if (imgData) {
    a.addImage({ data: imgData, x: 8.3, y: 0, w: 5.033, h: CANVAS_H, cover: true });
    a.addRect({ x: 0, y: 0, w: 8.3, h: CANVAS_H, fillHex: p.bg });
  }
  a.addText(s.title, {
    x: 0.8, y: 2.6, w: 7.2, h: 2.0,
    fontFace: FONT_HEAD, fontSize: 60, bold: true, color: "FFFFFF",
  });
  if (s.subtitle) {
    a.addText(s.subtitle, {
      x: 0.8, y: 4.8, w: 7.2, h: 0.8,
      fontFace: FONT_BODY, fontSize: 20, color: p.accent,
    });
  }
  if (s.footer) {
    a.addText(s.footer, {
      x: 0.8, y: 6.9, w: 7.2, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, color: "9AA5B4",
    });
  }
}

function renderTitleBlock(a: SlideAdapter, s: Structured, p: Required<Palette>) {
  a.setBackground("FFFFFF");
  if (s.kicker) {
    a.addText(s.kicker.toUpperCase(), {
      x: 0.6, y: 0.45, w: 12, h: 0.35,
      fontFace: FONT_BODY, fontSize: 11, bold: true, charSpacing: 4, color: p.accent,
    });
  }
  a.addText(s.title, {
    x: 0.6, y: 0.8, w: 12, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 32, bold: true, color: p.ink,
  });
  a.addRect({ x: 0.6, y: 1.72, w: 0.9, h: 0.05, fillHex: p.accent });
}

function renderContent(a: SlideAdapter, s: Structured, p: Required<Palette>, imgData: string | null) {
  renderTitleBlock(a, s, p);
  const hasImage = !!imgData;
  const textW = hasImage ? 7.0 : 12.1;
  let y = 2.0;
  if (s.subtitle) {
    a.addText(s.subtitle, {
      x: 0.6, y, w: textW, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, italic: true, color: p.muted,
    });
    y += 0.55;
  }
  for (const para of s.paragraphs ?? []) {
    const h = Math.min(1.5, 0.35 + para.length / 220);
    a.addText(para, {
      x: 0.6, y, w: textW, h: 1.4,
      fontFace: FONT_BODY, fontSize: 15, color: p.ink,
      paraSpaceAfter: 6, valign: "top",
    });
    y += h;
  }
  const bullets = s.bullets ?? [];
  if (bullets.length > 0) {
    a.addBullets(bullets, {
      x: 0.6, y, w: textW, h: CANVAS_H - y - 0.6,
      fontFace: FONT_BODY, fontSize: 15, color: p.ink,
      paraSpaceAfter: 6, valign: "top",
    });
  }
  if (hasImage) {
    a.addImage({ data: imgData!, x: 8.0, y: 2.0, w: 4.8, h: 4.5, cover: true });
  }
  if (s.footer) {
    a.addText(s.footer, {
      x: 0.6, y: 7.05, w: 12.1, h: 0.35,
      fontFace: FONT_BODY, fontSize: 10, color: p.muted,
    });
  }
}

function renderAgenda(a: SlideAdapter, s: Structured, p: Required<Palette>) {
  renderTitleBlock(a, s, p);
  const items = s.bullets ?? [];
  const rowH = Math.min(0.8, 4.4 / Math.max(items.length, 1));
  items.forEach((t, i) => {
    const y = 2.2 + i * (rowH + 0.15);
    a.addEllipse({ x: 0.6, y, w: 0.55, h: 0.55, fillHex: p.primary });
    a.addText(String(i + 1).padStart(2, "0"), {
      x: 0.6, y, w: 0.55, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    a.addText(t, {
      x: 1.35, y, w: 11.3, h: rowH,
      fontFace: FONT_BODY, fontSize: 18, color: p.ink, valign: "middle",
    });
  });
}

function renderTwoColumn(a: SlideAdapter, s: Structured, p: Required<Palette>) {
  renderTitleBlock(a, s, p);
  const cols = (s.columns ?? []).slice(0, 2);
  cols.forEach((col, i) => {
    const x = i === 0 ? 0.6 : 6.95;
    a.addRect({ x, y: 2.05, w: 5.8, h: 4.9, fillHex: "F5F6F8", lineHex: "E4E7EC", lineWidth: 0.5 });
    if (col.heading) {
      a.addText(col.heading, {
        x: x + 0.3, y: 2.25, w: 5.4, h: 0.5,
        fontFace: FONT_HEAD, fontSize: 20, bold: true, color: p.primary,
      });
    }
    a.addBullets(col.items ?? [], {
      x: x + 0.3, y: col.heading ? 2.85 : 2.25, w: 5.4,
      h: col.heading ? 4.0 : 4.6,
      fontFace: FONT_BODY, fontSize: 14, color: p.ink,
      paraSpaceAfter: 6, valign: "top",
    });
  });
}

function renderStats(a: SlideAdapter, s: Structured, p: Required<Palette>) {
  renderTitleBlock(a, s, p);
  const stats = (s.stats ?? []).slice(0, 3);
  const gap = 0.35;
  const cardW = (12.1 - gap * (stats.length - 1)) / Math.max(stats.length, 1);
  stats.forEach((st, i) => {
    const x = 0.6 + i * (cardW + gap);
    a.addRect({ x, y: 2.3, w: cardW, h: 3.6, fillHex: p.primary });
    a.addText(st.value, {
      x, y: 2.6, w: cardW, h: 1.8,
      fontFace: FONT_HEAD, fontSize: 60, bold: true, color: p.accent,
      align: "center", valign: "middle",
    });
    a.addText(st.label, {
      x: x + 0.2, y: 4.4, w: cardW - 0.4, h: 1.3,
      fontFace: FONT_BODY, fontSize: 14, color: "E5E7EB",
      align: "center", valign: "top",
    });
  });
  const paras = (s.paragraphs ?? []).join("\n");
  if (paras) {
    a.addText(paras, {
      x: 0.6, y: 6.15, w: 12.1, h: 0.8,
      fontFace: FONT_BODY, fontSize: 13, italic: true, color: p.muted, align: "center",
    });
  }
}

function renderQuote(a: SlideAdapter, s: Structured, p: Required<Palette>) {
  a.setBackground("F7F5F0");
  const q = s.quote ?? { text: s.title, author: "" };
  a.addText("\u201C", {
    x: 0.6, y: 0.6, w: 3, h: 3,
    fontFace: FONT_HEAD, fontSize: 220, bold: true, color: p.accent,
  });
  a.addText(q.text, {
    x: 1.8, y: 2.2, w: 10.5, h: 3.5,
    fontFace: FONT_HEAD, fontSize: 30, italic: true, color: p.ink,
  });
  if (q.author) {
    a.addText(`— ${q.author}`, {
      x: 1.8, y: 5.9, w: 10.5, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, bold: true, color: p.primary,
    });
  }
}

export function renderSlide(
  a: SlideAdapter, s: Structured, palette: Required<Palette>, imgData: string | null,
) {
  switch (s.layout) {
    case "cover":      return renderCover(a, s, palette, imgData);
    case "closing":    return renderClosing(a, s, palette, imgData);
    case "agenda":     return renderAgenda(a, s, palette);
    case "two_column": return renderTwoColumn(a, s, palette);
    case "stats":      return renderStats(a, s, palette);
    case "quote":      return renderQuote(a, s, palette);
    case "content":
    default:           return renderContent(a, s, palette, imgData);
  }
}

// ---------------------------------------------------------------------------
// PPTX ADAPTER (pptxgenjs)
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createPptxAdapter(slide: any): SlideAdapter {
  return {
    setBackground(color) {
      slide.background = { color };
    },
    addRect({ x, y, w, h, fillHex, transparency, lineHex, lineWidth }) {
      slide.addShape("rect", {
        x, y, w, h,
        fill: fillHex ? { color: fillHex, transparency } : { type: "none" },
        line: lineHex ? { color: lineHex, width: lineWidth ?? 0.75 } : { type: "none" },
      });
    },
    addEllipse({ x, y, w, h, fillHex }) {
      slide.addShape("ellipse", {
        x, y, w, h,
        fill: { color: fillHex },
        line: { type: "none" },
      });
    },
    addImage({ data, x, y, w, h, cover }) {
      slide.addImage({
        data, x, y, w, h,
        sizing: cover ? { type: "cover", w, h } : undefined,
      });
    },
    addText(text, o) {
      slide.addText(text, textOptsToPptx(o));
    },
    addBullets(items, o) {
      slide.addText(
        items.map((t) => ({ text: t, options: { bullet: { code: "25CF" } } })),
        textOptsToPptx(o),
      );
    },
  };
}

function textOptsToPptx(o: TextOpts) {
  return {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fontFace: o.fontFace, fontSize: o.fontSize,
    bold: o.bold, italic: o.italic,
    color: o.color,
    align: o.align, valign: o.valign,
    charSpacing: o.charSpacing,
    paraSpaceAfter: o.paraSpaceAfter,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// PDF ADAPTER (jsPDF)
// Semua koordinat inch dikonversi ke points (72 pt / inch). Font PDF terbatas
// (helvetica/times); FONT_HEAD & FONT_BODY dipetakan ke helvetica agar
// posisi/ukuran tetap sama walau glyph tidak identik.
// ---------------------------------------------------------------------------

import type { jsPDF as JsPDF } from "jspdf";

const PT_PER_IN = 72;
const IN = (v: number) => v * PT_PER_IN;

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace(/^#/, "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

export function createPdfAdapter(doc: JsPDF): SlideAdapter {
  const setFont = (o: TextOpts) => {
    const style = o.bold && o.italic ? "bolditalic" : o.bold ? "bold" : o.italic ? "italic" : "normal";
    doc.setFont("helvetica", style);
    doc.setFontSize(o.fontSize);
    const [r, g, b] = hexToRgb(o.color);
    doc.setTextColor(r, g, b);
    if (o.charSpacing) doc.setCharSpace(o.charSpacing * 0.5);
    else doc.setCharSpace(0);
  };

  const drawWrapped = (text: string, o: TextOpts) => {
    setFont(o);
    const wPt = IN(o.w);
    const hPt = IN(o.h);
    const lines = doc.splitTextToSize(text, wPt) as string[];
    const lineHeight = o.fontSize * 1.2;
    const totalH = lines.length * lineHeight;
    let yStart = IN(o.y);
    if (o.valign === "middle") yStart += (hPt - totalH) / 2;
    else if (o.valign === "bottom") yStart += hPt - totalH;
    let alignX = IN(o.x);
    if (o.align === "center") alignX = IN(o.x) + wPt / 2;
    else if (o.align === "right") alignX = IN(o.x) + wPt;
    // jsPDF text() menggunakan baseline; offset satu lineHeight ke bawah.
    let cursor = yStart + o.fontSize;
    for (const ln of lines) {
      if (cursor - o.fontSize > yStart + hPt) break;
      doc.text(ln, alignX, cursor, {
        align: o.align ?? "left",
        baseline: "alphabetic",
      });
      cursor += lineHeight;
    }
  };

  return {
    setBackground(color) {
      const [r, g, b] = hexToRgb(color);
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, IN(CANVAS_W), IN(CANVAS_H), "F");
    },
    addRect({ x, y, w, h, fillHex, transparency, lineHex, lineWidth }) {
      const gState = transparency
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new (doc as any).GState({ opacity: 1 - transparency / 100 })
        : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (gState) (doc as any).setGState(gState);
      if (fillHex) {
        const [r, g, b] = hexToRgb(fillHex);
        doc.setFillColor(r, g, b);
      }
      if (lineHex) {
        const [r, g, b] = hexToRgb(lineHex);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth((lineWidth ?? 0.75) * 0.75);
      }
      const style = fillHex && lineHex ? "FD" : fillHex ? "F" : lineHex ? "D" : "";
      if (style) doc.rect(IN(x), IN(y), IN(w), IN(h), style);
      if (gState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
      }
    },
    addEllipse({ x, y, w, h, fillHex }) {
      const [r, g, b] = hexToRgb(fillHex);
      doc.setFillColor(r, g, b);
      doc.ellipse(IN(x) + IN(w) / 2, IN(y) + IN(h) / 2, IN(w) / 2, IN(h) / 2, "F");
    },
    addImage({ data, x, y, w, h }) {
      try {
        const fmt = data.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(data, fmt, IN(x), IN(y), IN(w), IN(h), undefined, "FAST");
      } catch {
        // Ignore image failures agar PDF tetap dihasilkan.
      }
    },
    addText(text, o) {
      drawWrapped(text, o);
    },
    addBullets(items, o) {
      const bulletChar = "\u2022  ";
      // Render tiap item sebagai baris terpisah, geser y sesuai jumlah wrap.
      const wPt = IN(o.w);
      setFont(o);
      const lineHeight = o.fontSize * 1.35;
      let cursor = IN(o.y) + o.fontSize;
      const maxY = IN(o.y) + IN(o.h);
      for (const item of items) {
        const wrapped = doc.splitTextToSize(bulletChar + item, wPt) as string[];
        for (const ln of wrapped) {
          if (cursor - o.fontSize > maxY) return;
          doc.text(ln, IN(o.x), cursor, { baseline: "alphabetic" });
          cursor += lineHeight;
        }
        cursor += (o.paraSpaceAfter ?? 0) * 0.5;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// HIGH-LEVEL BUILDERS
// ---------------------------------------------------------------------------

export async function buildImageDataMap(slides: SlideInput[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const urls = Array.from(new Set(slides.map((s) => s.imageUrl).filter((u): u is string => !!u)));
  await Promise.all(urls.map(async (url) => map.set(url, await fetchImageAsData(url))));
  return map;
}

export function structuredOrFallback(s?: Structured): Structured {
  return s ?? { layout: "content", title: "(Slide tanpa data terstruktur)" };
}

export async function buildPptx(
  slides: SlideInput[],
  meta: { title?: string; subtitle?: string; palette?: Palette } | undefined,
  filename: string,
) {
  const pptxMod = await import("pptxgenjs");
  const PptxGen = pptxMod.default;
  const pres = new PptxGen();
  pres.layout = "LAYOUT_WIDE";
  if (meta?.title) pres.title = meta.title;
  const palette = normalizePalette(meta?.palette);
  const images = await buildImageDataMap(slides);
  for (const s of slides) {
    const slide = pres.addSlide();
    const adapter = createPptxAdapter(slide);
    const structured = structuredOrFallback(s.structured);
    const imgData = s.imageUrl ? images.get(s.imageUrl) ?? null : null;
    renderSlide(adapter, structured, palette, imgData);
    if (s.notes) slide.addNotes(s.notes);
  }
  await pres.writeFile({ fileName: filename });
}

export async function buildPdf(
  slides: SlideInput[],
  meta: { title?: string; subtitle?: string; palette?: Palette } | undefined,
  filename: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [IN(CANVAS_W), IN(CANVAS_H)],
  });
  if (meta?.title) doc.setProperties({ title: meta.title });
  const palette = normalizePalette(meta?.palette);
  const images = await buildImageDataMap(slides);
  slides.forEach((s, i) => {
    if (i > 0) doc.addPage([IN(CANVAS_W), IN(CANVAS_H)], "landscape");
    const adapter = createPdfAdapter(doc);
    const structured = structuredOrFallback(s.structured);
    const imgData = s.imageUrl ? images.get(s.imageUrl) ?? null : null;
    renderSlide(adapter, structured, palette, imgData);
  });
  doc.save(filename);
}