import type { ReactNode } from "react";
import { useMemo } from "react";

type PaperBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] };

type PaperSection = {
  heading: string;
  paragraphs?: string[];
  blocks?: PaperBlock[];
  subsections?: {
    heading: string;
    paragraphs?: string[];
    blocks?: PaperBlock[];
  }[];
};

type PaperContent = {
  title?: string;
  course?: string;
  kata_pengantar?: string;
  abstract?: string;
  sections?: PaperSection[];
  conclusion?: string;
  references?: string[];
};

// HTML-first slide payload (baru).
type HtmlSlide = {
  kind?: "cover" | "agenda" | "content" | "quote" | "stats" | "closing";
  html?: string;
  notes?: string;
  imageCredit?: string;
};

type PresentationContent = {
  meta?: { title?: string; subtitle?: string };
  // Field lama (fallback), tidak dipakai renderer baru.
  title?: string;
  subtitle?: string;
  slides?: HtmlSlide[];
};

function renderBlocks(section: { paragraphs?: string[]; blocks?: PaperBlock[] }): ReactNode {
  if (section.blocks && section.blocks.length > 0) {
    return section.blocks.map((b, i) => {
      if (b.kind === "bullets") {
        return (
          <ul key={i} className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-foreground">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i} className="text-justify text-[13px] leading-relaxed text-foreground">
          {b.text}
        </p>
      );
    });
  }
  return (section.paragraphs ?? []).map((p, i) => (
    <p key={i} className="text-justify text-[13px] leading-relaxed text-foreground">
      {p}
    </p>
  ));
}

export function PaperContentPreview({ content }: { content: PaperContent }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 rounded-xl border border-border bg-background p-6 shadow-sm max-h-[600px] overflow-y-auto">
      <header className="border-b border-border pb-4 text-center">
        {content.course && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {content.course}
          </p>
        )}
        <h3 className="mt-2 text-lg font-semibold text-foreground">{content.title}</h3>
      </header>

      {content.abstract && (
        <section className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Abstrak</h4>
          <p className="text-justify text-[13px] italic leading-relaxed text-foreground">
            {content.abstract}
          </p>
        </section>
      )}

      {(content.sections ?? []).map((s, i) => (
        <section key={i} className="space-y-3">
          <h4 className="text-sm font-bold uppercase text-foreground">{s.heading}</h4>
          <div className="space-y-2">{renderBlocks(s)}</div>
          {(s.subsections ?? []).map((sub, j) => (
            <div key={j} className="mt-3 space-y-2 border-l-2 border-border pl-3">
              <h5 className="text-[13px] font-semibold text-foreground">{sub.heading}</h5>
              <div className="space-y-2">{renderBlocks(sub)}</div>
            </div>
          ))}
        </section>
      ))}

      {content.conclusion && (
        <section className="space-y-2">
          <h4 className="text-sm font-bold uppercase text-foreground">Kesimpulan</h4>
          <p className="text-justify text-[13px] leading-relaxed text-foreground">
            {content.conclusion}
          </p>
        </section>
      )}

      {content.references && content.references.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-bold uppercase text-foreground">Daftar Pustaka</h4>
          <ol className="space-y-1.5">
            {content.references.map((r, i) => (
              <li key={i} className="text-[12px] leading-relaxed text-foreground">
                {r}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export function SlidesContentPreview({ content }: { content: PresentationContent }) {
  const slides = content.slides ?? [];
  const title = content.meta?.title ?? content.title;
  const subtitle = content.meta?.subtitle ?? content.subtitle;
  return (
    <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1">
      {(title || subtitle) && (
        <div className="rounded-xl border border-border bg-card p-4 text-foreground shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Deck</p>
          {title && <h3 className="mt-1 text-base font-semibold">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {slides.map((s, i) => (
        <HtmlSlideCard key={i} index={i + 1} slide={s} />
      ))}
    </div>
  );
}

function HtmlSlideCard({ index, slide }: { index: number; slide: HtmlSlide }) {
  // Iframe sandbox: HTML dari AI dianggap untrusted. Font Awesome + Google Fonts
  // dimuat di dalam iframe, konten discale down agar muat card 640px.
  const srcDoc = useMemo(() => buildSlideSrcDoc(slide.html ?? ""), [slide.html]);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-3 py-1.5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Slide {index}
          {slide.kind ? ` · ${slide.kind}` : ""}
        </p>
        {slide.imageCredit && (
          <p className="text-[10px] text-muted-foreground">{slide.imageCredit}</p>
        )}
      </div>
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          title={`Slide ${index}`}
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
        />
      </div>
      {slide.notes && (
        <details className="border-t border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Catatan pembicara</summary>
          <p className="mt-1 leading-relaxed">{slide.notes}</p>
        </details>
      )}
    </div>
  );
}

export function buildSlideSrcDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<style>
  html,body{margin:0;padding:0;background:#fff;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
  body{display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .slide-wrap{width:1280px;height:720px;transform-origin:top left;}
  .slide{width:1280px;height:720px;box-sizing:border-box;overflow:hidden;}
  h1,h2,h3,h4{font-family:'Space Grotesk',system-ui,sans-serif;margin:0;}
  p{margin:0;}
</style>
<script>
  window.addEventListener('load',()=>{
    const wrap=document.querySelector('.slide-wrap');
    if(!wrap)return;
    const fit=()=>{const s=Math.min(window.innerWidth/1280,window.innerHeight/720);wrap.style.transform='scale('+s+')';};
    fit();window.addEventListener('resize',fit);
  });
<\/script>
</head><body><div class="slide-wrap">${html}</div></body></html>`;
}
