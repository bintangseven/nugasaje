import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// EDITABLE PPTX BUILDER
// Konsumsi field 'structured' + 'imageUrl' yang di-generate AI, lalu bangun
// slide via pptxgenjs sebagai text box / shape / image asli — sehingga tiap
// elemen bisa di-edit langsung di PowerPoint / Google Slides.
// ============================================================================

type Palette = {
  primary?: string;
  accent?: string;
  bg?: string;
  ink?: string;
  muted?: string;
};

type Structured = {
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

type Slide = {
  notes?: string;
  imageUrl?: string;
  imageCredit?: string;
  structured?: Structured;
};

type Props = {
  slides: Slide[];
  meta?: { title?: string; subtitle?: string; palette?: Palette };
  filename: string;
  disabled?: boolean;
};

// Warna default kalau AI belum memberi palette.
const FALLBACK: Required<Palette> = {
  primary: "0B2545",
  accent: "C9A227",
  bg: "0B2545",
  ink: "10151F",
  muted: "5C6470",
};

const hex = (c: string | undefined, fallback: string) => {
  const v = (c ?? fallback).replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : fallback;
};

// Fetch Unsplash → base64 (dijalankan di browser; Unsplash mengizinkan CORS).
async function fetchImageAsData(url: string): Promise<string | null> {
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

const FONT_HEAD = "Space Grotesk";
const FONT_BODY = "Plus Jakarta Sans";

// ---------------------------------------------------------------------------
// LAYOUT RENDERERS
// Semua koordinat dalam inch (canvas 13.333 × 7.5).
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

function renderCover(
  slide: any,
  s: Structured,
  p: Required<Palette>,
  imageData: string | null,
) {
  slide.background = { color: p.bg };
  if (imageData) {
    slide.addImage({ data: imageData, x: 0, y: 0, w: 13.333, h: 7.5 });
    // Overlay gelap agar teks kontras.
    slide.addShape("rect", {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: p.bg, transparency: 30 },
      line: { type: "none" },
    });
  }
  // Aksen strip vertikal kiri.
  slide.addShape("rect", {
    x: 0.5, y: 1.0, w: 0.08, h: 1.6,
    fill: { color: p.accent }, line: { type: "none" },
  });
  if (s.kicker) {
    slide.addText(s.kicker.toUpperCase(), {
      x: 0.8, y: 1.0, w: 12, h: 0.5,
      fontFace: FONT_BODY, fontSize: 14, bold: true, charSpacing: 4,
      color: p.accent,
    });
  }
  slide.addText(s.title, {
    x: 0.8, y: 1.6, w: 11.5, h: 3.5,
    fontFace: FONT_HEAD, fontSize: 54, bold: true, color: "FFFFFF",
    valign: "top",
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.8, y: 5.4, w: 11.5, h: 1.0,
      fontFace: FONT_BODY, fontSize: 20, color: "E5E7EB",
    });
  }
  if (s.footer) {
    slide.addText(s.footer, {
      x: 0.8, y: 6.9, w: 11.5, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, color: "9AA5B4",
    });
  }
}

function renderClosing(
  slide: any, s: Structured, p: Required<Palette>, imageData: string | null,
) {
  slide.background = { color: p.bg };
  if (imageData) {
    slide.addImage({ data: imageData, x: 8.3, y: 0, w: 5.033, h: 7.5 });
    slide.addShape("rect", {
      x: 0, y: 0, w: 8.3, h: 7.5, fill: { color: p.bg }, line: { type: "none" },
    });
  }
  slide.addText(s.title, {
    x: 0.8, y: 2.6, w: 7.2, h: 2.0,
    fontFace: FONT_HEAD, fontSize: 60, bold: true, color: "FFFFFF",
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.8, y: 4.8, w: 7.2, h: 0.8,
      fontFace: FONT_BODY, fontSize: 20, color: p.accent,
    });
  }
  if (s.footer) {
    slide.addText(s.footer, {
      x: 0.8, y: 6.9, w: 7.2, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, color: "9AA5B4",
    });
  }
}

function renderTitleBlock(
  slide: any, s: Structured, p: Required<Palette>,
) {
  slide.background = { color: "FFFFFF" };
  if (s.kicker) {
    slide.addText(s.kicker.toUpperCase(), {
      x: 0.6, y: 0.45, w: 12, h: 0.35,
      fontFace: FONT_BODY, fontSize: 11, bold: true, charSpacing: 4, color: p.accent,
    });
  }
  slide.addText(s.title, {
    x: 0.6, y: 0.8, w: 12, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 32, bold: true, color: p.ink,
  });
  // Underline aksen.
  slide.addShape("rect", {
    x: 0.6, y: 1.72, w: 0.9, h: 0.05,
    fill: { color: p.accent }, line: { type: "none" },
  });
}

function renderContent(
  slide: any, s: Structured, p: Required<Palette>, imageData: string | null,
) {
  renderTitleBlock(slide, s, p);
  const hasImage = !!imageData;
  const textW = hasImage ? 7.0 : 12.1;
  let y = 2.0;
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.6, y, w: textW, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, italic: true, color: p.muted,
    });
    y += 0.55;
  }
  for (const para of s.paragraphs ?? []) {
    slide.addText(para, {
      x: 0.6, y, w: textW, h: 1.4,
      fontFace: FONT_BODY, fontSize: 15, color: p.ink,
      paraSpaceAfter: 6, valign: "top",
    });
    y += Math.min(1.5, 0.35 + para.length / 220);
  }
  const bullets = s.bullets ?? [];
  if (bullets.length > 0) {
    slide.addText(
      bullets.map((t) => ({ text: t, options: { bullet: { code: "25CF" } } })),
      {
        x: 0.6, y, w: textW, h: 7.5 - y - 0.6,
        fontFace: FONT_BODY, fontSize: 15, color: p.ink,
        paraSpaceAfter: 6, valign: "top",
      },
    );
  }
  if (hasImage) {
    slide.addImage({
      data: imageData!,
      x: 8.0, y: 2.0, w: 4.8, h: 4.5,
      sizing: { type: "cover", w: 4.8, h: 4.5 },
    });
  }
  if (s.footer) {
    slide.addText(s.footer, {
      x: 0.6, y: 7.05, w: 12.1, h: 0.35,
      fontFace: FONT_BODY, fontSize: 10, color: p.muted,
    });
  }
}

function renderAgenda(slide: any, s: Structured, p: Required<Palette>) {
  renderTitleBlock(slide, s, p);
  const items = s.bullets ?? [];
  const rowH = Math.min(0.8, 4.4 / Math.max(items.length, 1));
  items.forEach((t, i) => {
    const y = 2.2 + i * (rowH + 0.15);
    slide.addShape("ellipse", {
      x: 0.6, y, w: 0.55, h: 0.55,
      fill: { color: p.primary }, line: { type: "none" },
    });
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: 0.6, y, w: 0.55, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    slide.addText(t, {
      x: 1.35, y, w: 11.3, h: rowH,
      fontFace: FONT_BODY, fontSize: 18, color: p.ink, valign: "middle",
    });
  });
}

function renderTwoColumn(slide: any, s: Structured, p: Required<Palette>) {
  renderTitleBlock(slide, s, p);
  const cols = (s.columns ?? []).slice(0, 2);
  cols.forEach((col, i) => {
    const x = i === 0 ? 0.6 : 6.95;
    slide.addShape("rect", {
      x, y: 2.05, w: 5.8, h: 4.9,
      fill: { color: "F5F6F8" }, line: { color: "E4E7EC", width: 0.5 },
    });
    if (col.heading) {
      slide.addText(col.heading, {
        x: x + 0.3, y: 2.25, w: 5.4, h: 0.5,
        fontFace: FONT_HEAD, fontSize: 20, bold: true, color: p.primary,
      });
    }
    slide.addText(
      (col.items ?? []).map((t) => ({ text: t, options: { bullet: { code: "25CF" } } })),
      {
        x: x + 0.3, y: col.heading ? 2.85 : 2.25, w: 5.4, h: col.heading ? 4.0 : 4.6,
        fontFace: FONT_BODY, fontSize: 14, color: p.ink,
        paraSpaceAfter: 6, valign: "top",
      },
    );
  });
}

function renderStats(slide: any, s: Structured, p: Required<Palette>) {
  renderTitleBlock(slide, s, p);
  const stats = (s.stats ?? []).slice(0, 3);
  const gap = 0.35;
  const cardW = (12.1 - gap * (stats.length - 1)) / Math.max(stats.length, 1);
  stats.forEach((st, i) => {
    const x = 0.6 + i * (cardW + gap);
    slide.addShape("rect", {
      x, y: 2.3, w: cardW, h: 3.6,
      fill: { color: p.primary }, line: { type: "none" },
    });
    slide.addText(st.value, {
      x, y: 2.6, w: cardW, h: 1.8,
      fontFace: FONT_HEAD, fontSize: 60, bold: true, color: p.accent,
      align: "center", valign: "middle",
    });
    slide.addText(st.label, {
      x: x + 0.2, y: 4.4, w: cardW - 0.4, h: 1.3,
      fontFace: FONT_BODY, fontSize: 14, color: "E5E7EB",
      align: "center", valign: "top",
    });
  });
  const paras = (s.paragraphs ?? []).join("\n");
  if (paras) {
    slide.addText(paras, {
      x: 0.6, y: 6.15, w: 12.1, h: 0.8,
      fontFace: FONT_BODY, fontSize: 13, italic: true, color: p.muted,
      align: "center",
    });
  }
}

function renderQuote(slide: any, s: Structured, p: Required<Palette>) {
  slide.background = { color: "F7F5F0" };
  const q = s.quote ?? { text: s.title, author: "" };
  slide.addText("\u201C", {
    x: 0.6, y: 0.6, w: 3, h: 3,
    fontFace: FONT_HEAD, fontSize: 220, bold: true, color: p.accent,
  });
  slide.addText(q.text, {
    x: 1.8, y: 2.2, w: 10.5, h: 3.5,
    fontFace: FONT_HEAD, fontSize: 30, italic: true, color: p.ink,
  });
  if (q.author) {
    slide.addText(`— ${q.author}`, {
      x: 1.8, y: 5.9, w: 10.5, h: 0.5,
      fontFace: FONT_BODY, fontSize: 16, bold: true, color: p.primary,
    });
  }
}

function renderSlide(
  slide: any, s: Structured, palette: Required<Palette>, imageData: string | null,
) {
  switch (s.layout) {
    case "cover":      return renderCover(slide, s, palette, imageData);
    case "closing":    return renderClosing(slide, s, palette, imageData);
    case "agenda":     return renderAgenda(slide, s, palette);
    case "two_column": return renderTwoColumn(slide, s, palette);
    case "stats":      return renderStats(slide, s, palette);
    case "quote":      return renderQuote(slide, s, palette);
    case "content":
    default:           return renderContent(slide, s, palette, imageData);
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export function DownloadPptxButton({ slides, meta, filename, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (busy || slides.length === 0) return;
    setBusy(true);
    try {
      const pptxMod = await import("pptxgenjs");
      const PptxGen = pptxMod.default;
      const pres = new PptxGen();
      pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
      if (meta?.title) pres.title = meta.title;

      const palette: Required<Palette> = {
        primary: hex(meta?.palette?.primary, FALLBACK.primary),
        accent: hex(meta?.palette?.accent, FALLBACK.accent),
        bg: hex(meta?.palette?.bg, FALLBACK.bg),
        ink: hex(meta?.palette?.ink, FALLBACK.ink),
        muted: hex(meta?.palette?.muted, FALLBACK.muted),
      };

      // Prefetch semua gambar Unsplash paralel.
      const imageDataMap = new Map<string, string | null>();
      await Promise.all(
        Array.from(new Set(slides.map((s) => s.imageUrl).filter((u): u is string => !!u))).map(
          async (url) => imageDataMap.set(url, await fetchImageAsData(url)),
        ),
      );

      for (const s of slides) {
        const slide = pres.addSlide();
        const structured: Structured = s.structured ?? {
          layout: "content",
          title: "(Slide tanpa data terstruktur)",
        };
        const imgData = s.imageUrl ? imageDataMap.get(s.imageUrl) ?? null : null;
        renderSlide(slide, structured, palette, imgData);
        if (s.notes) slide.addNotes(s.notes);
      }

      await pres.writeFile({ fileName: filename });
    } catch (err) {
      console.error("[pptx-download]", err);
      toast.error(err instanceof Error ? err.message : "Gagal membuat file PPTX di browser");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || busy || slides.length === 0}
      onClick={handle}
      className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Unduh .pptx
    </button>
  );
}