import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildSlideSrcDoc } from "./ContentPreview";

// ============================================================================
// HYBRID PPTX BUILDER
// 1) Snapshot HTML preview (identik dengan iframe preview) via html2canvas →
//    PNG full-bleed 13.333×7.5 in sebagai LAPISAN BAWAH (visual persis).
// 2) Text-box pptxgenjs editable ditaruh DI ATAS gambar sesuai koordinat
//    'structured.regions' yang dikirim AI (title/subtitle/body/quote/footer).
// Hasil: tampilan sama dengan preview, teks utama tetap bisa diedit di
// PowerPoint / Google Slides.
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
  regions?: Partial<Record<
    "title" | "subtitle" | "body" | "quote" | "footer",
    {
      x: number; y: number; w: number; h: number;
      fontSize?: number; color?: string;
      align?: "left" | "center" | "right"; bold?: boolean;
    }
  >>;
};

type Slide = {
  notes?: string;
  html?: string;
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

const FONT_HEAD = "Space Grotesk";
const FONT_BODY = "Plus Jakarta Sans";

// ---------------------------------------------------------------------------
// Snapshot HTML slide (1280×720) → PNG data URL via html2canvas.
// ---------------------------------------------------------------------------
async function snapshotSlideHtml(html: string): Promise<string | null> {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-99999px",
    top: "0",
    width: "1280px",
    height: "720px",
    border: "0",
  } as CSSStyleDeclaration);
  iframe.setAttribute("aria-hidden", "true");
  // srcdoc = full HTML doc; kita pakai helper yang sama dengan preview supaya
  // font, FA, dan layout identik. Tapi hilangkan script fit() karena kita
  // butuh rendering di ukuran 1280×720 natural (no scale) untuk snapshot.
  const src = buildSlideSrcDoc(html)
    // Nonaktifkan skrip fit() scale — kita render di ukuran natural.
    .replace(/<script>[\s\S]*?<\/script>/g, "");
  iframe.srcdoc = src;
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((res) => {
      iframe.onload = () => res();
      // Fallback timeout.
      setTimeout(() => res(), 4000);
    });
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) return null;

    // Enable CORS on images so canvas tidak tainted.
    doc.querySelectorAll("img").forEach((img) => {
      img.setAttribute("crossorigin", "anonymous");
    });

    // Tunggu fonts + images siap.
    try {
      await (doc as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    } catch { /* noop */ }
    await Promise.all(
      Array.from(doc.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((r) => {
              img.onload = () => r();
              img.onerror = () => r();
              setTimeout(() => r(), 3000);
            }),
      ),
    );
    // Beri 1 frame ekstra biar layout final.
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(doc.body, {
      width: 1280,
      height: 720,
      windowWidth: 1280,
      windowHeight: 720,
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[pptx-snapshot] gagal snapshot slide:", e);
    return null;
  } finally {
    iframe.remove();
  }
}

// ---------------------------------------------------------------------------
// Text-box editable di atas snapshot berdasar structured.regions.
// ---------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
function addEditableTextLayer(slide: any, s: Structured, palette: Required<Palette>) {
  const R = s.regions ?? {};
  const commonOpts = {
    fill: { type: "none" as const },
    line: { type: "none" as const },
    margin: 0,
    valign: "top" as const,
    isTextBox: true,
  };

  const put = (
    text: string,
    region: NonNullable<Structured["regions"]>[keyof NonNullable<Structured["regions"]>],
    fallback: { fontFace: string; fontSize: number; color: string; bold?: boolean; italic?: boolean },
    extra?: Record<string, unknown>,
  ) => {
    if (!text || !region) return;
    const opts = {
      x: region.x, y: region.y, w: region.w, h: region.h,
      fontFace: fallback.fontFace,
      fontSize: region.fontSize ?? fallback.fontSize,
      color: hex(region.color, fallback.color),
      bold: region.bold ?? fallback.bold ?? false,
      italic: fallback.italic ?? false,
      align: region.align ?? "left",
      ...commonOpts,
      ...(extra ?? {}),
    };
    slide.addText(text, opts);
  };

  // Title
  put(s.title, R.title, { fontFace: FONT_HEAD, fontSize: 32, color: palette.ink, bold: true });
  // Subtitle
  if (s.subtitle) {
    put(s.subtitle, R.subtitle, { fontFace: FONT_BODY, fontSize: 18, color: palette.muted });
  }
  // Body: paragraphs + bullets digabung
  const bodyItems: Array<{ text: string; options?: Record<string, unknown> }> = [];
  for (const p of s.paragraphs ?? []) {
    bodyItems.push({ text: p, options: { breakLine: true, paraSpaceAfter: 6 } });
  }
  for (const b of s.bullets ?? []) {
    bodyItems.push({ text: b, options: { bullet: { code: "25CF" }, breakLine: true, paraSpaceAfter: 4 } });
  }
  if (bodyItems.length > 0 && R.body) {
    slide.addText(bodyItems, {
      x: R.body.x, y: R.body.y, w: R.body.w, h: R.body.h,
      fontFace: FONT_BODY,
      fontSize: R.body.fontSize ?? 14,
      color: hex(R.body.color, palette.ink),
      align: R.body.align ?? "left",
      bold: R.body.bold ?? false,
      ...commonOpts,
    });
  }
  // Quote
  if (s.quote?.text) {
    put(
      s.quote.author ? `${s.quote.text}\n— ${s.quote.author}` : s.quote.text,
      R.quote,
      { fontFace: FONT_HEAD, fontSize: 24, color: palette.ink, italic: true },
    );
  }
  // Footer
  if (s.footer) {
    put(s.footer, R.footer, { fontFace: FONT_BODY, fontSize: 10, color: palette.muted });
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

      // Snapshot semua slide HTML paralel (biar cepat).
      const snapshots = await Promise.all(
        slides.map((s) => (s.html ? snapshotSlideHtml(s.html) : Promise.resolve(null))),
      );

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const slide = pres.addSlide();
        const png = snapshots[i];
        if (png) {
          slide.addImage({ data: png, x: 0, y: 0, w: 13.333, h: 7.5 });
        } else {
          slide.background = { color: "FFFFFF" };
        }
        if (s.structured) addEditableTextLayer(slide, s.structured, palette);
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