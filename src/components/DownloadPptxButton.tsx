import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildSlideSrcDoc } from "./ContentPreview";

type HtmlSlide = { html?: string; notes?: string };

type Props = {
  slides: HtmlSlide[];
  filename: string;
  disabled?: boolean;
};

/**
 * Render tiap slide HTML di iframe tersembunyi 1280x720, snapshot ke PNG via
 * html2canvas, lalu bungkus jadi PPTX via pptxgenjs — semua di browser.
 * Butuh iframe.contentWindow -> jadi sandbox harus allow-same-origin+scripts
 * (iframe hidup di origin app kita, hanya untuk render + snapshot).
 */
export function DownloadPptxButton({ slides, filename, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (busy || slides.length === 0) return;
    setBusy(true);
    let host: HTMLDivElement | null = null;
    try {
      const [{ default: html2canvas }, pptxMod] = await Promise.all([
        import("html2canvas"),
        import("pptxgenjs"),
      ]);
      const PptxGen = pptxMod.default;
      const pres = new PptxGen();
      pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in

      host = document.createElement("div");
      host.style.cssText =
        "position:fixed;left:-10000px;top:0;width:1280px;height:720px;pointer-events:none;";
      document.body.appendChild(host);

      for (let i = 0; i < slides.length; i++) {
        const iframe = document.createElement("iframe");
        iframe.width = "1280";
        iframe.height = "720";
        iframe.style.cssText = "border:0;width:1280px;height:720px;";
        // allow-same-origin diperlukan agar html2canvas dapat membaca DOM iframe.
        iframe.setAttribute("sandbox", "allow-same-origin allow-scripts");
        iframe.srcdoc = buildSlideSrcDoc(slides[i].html ?? "");
        host.innerHTML = "";
        host.appendChild(iframe);
        await new Promise<void>((resolve) => {
          iframe.addEventListener("load", () => resolve(), { once: true });
        });
        const doc = iframe.contentDocument!;
        const win = iframe.contentWindow as (Window & typeof globalThis) | null;
        const target = (doc.querySelector(".slide-wrap") as HTMLElement) ?? doc.body;
        // Kunci ukuran kanvas 1280x720 tanpa scaling agar font-size & posisi
        // absolut identik dengan preview. body-nya kita reset dari flex-center
        // supaya tidak menggeser konten ketika transform dilepas.
        target.style.transform = "none";
        target.style.transformOrigin = "top left";
        doc.body.style.cssText =
          "margin:0;padding:0;background:#fff;width:1280px;height:720px;overflow:hidden;";
        // Tunggu font web + Font Awesome siap agar metrik teks stabil.
        if (win && (win.document as Document & { fonts?: FontFaceSet }).fonts) {
          try {
            await (win.document as Document & { fonts: FontFaceSet }).fonts.ready;
          } catch {
            /* noop */
          }
        }
        // Tunggu semua <img> (Unsplash) selesai decode.
        const imgs = Array.from(doc.images);
        await Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            });
          }),
        );
        // Buffer kecil untuk layout final (CSS Grid / MathML).
        await new Promise((r) => setTimeout(r, 150));
        const canvas = await html2canvas(target, {
          width: 1280,
          height: 720,
          windowWidth: 1280,
          windowHeight: 720,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: false,
          imageTimeout: 15000,
          logging: false,
          // 2x → ~2560x1440, cukup tajam untuk slide 13.333x7.5 inch pada 200+ dpi.
          scale: 2,
        });
        const dataUrl = canvas.toDataURL("image/png");
        const slide = pres.addSlide();
        slide.background = { color: "FFFFFF" };
        slide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.333, h: 7.5 });
        if (slides[i].notes) slide.addNotes(slides[i].notes ?? "");
      }

      await pres.writeFile({ fileName: filename });
    } catch (err) {
      console.error("[pptx-download]", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat file PPTX di browser",
      );
    } finally {
      if (host) host.remove();
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