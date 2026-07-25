import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildPdf, buildPptx, type Palette, type SlideInput } from "@/lib/slide-renderer";

// ============================================================================
// DOWNLOAD BUTTONS
// PPTX dan PDF dibangun dari renderer bersama (src/lib/slide-renderer.ts)
// sehingga tata letak, warna, dan konten selalu identik antar format.
// ============================================================================

export type { SlideInput, Palette } from "@/lib/slide-renderer";

type Props = {
  slides: SlideInput[];
  meta?: { title?: string; subtitle?: string; palette?: Palette };
  filename: string;
  disabled?: boolean;
};

function baseName(filename: string): string {
  return filename.replace(/\.(pptx|pdf)$/i, "");
}

export function DownloadPptxButton({ slides, meta, filename, disabled }: Props) {
  const [busy, setBusy] = useState<"pptx" | "pdf" | null>(null);

  async function run(kind: "pptx" | "pdf") {
    if (busy || slides.length === 0) return;
    setBusy(kind);
    try {
      const base = baseName(filename);
      if (kind === "pptx") await buildPptx(slides, meta, `${base}.pptx`);
      else await buildPdf(slides, meta, `${base}.pdf`);
    } catch (err) {
      console.error(`[${kind}-download]`, err);
      toast.error(err instanceof Error ? err.message : `Gagal membuat file ${kind.toUpperCase()}`);
    } finally {
      setBusy(null);
    }
  }

  const isDisabled = disabled || slides.length === 0;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={isDisabled || busy !== null}
        onClick={() => run("pptx")}
        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy === "pptx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Unduh .pptx
      </button>
      <button
        type="button"
        disabled={isDisabled || busy !== null}
        onClick={() => run("pdf")}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Unduh .pdf
      </button>
    </div>
  );
}
