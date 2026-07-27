import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  buildImageDataMap,
  normalizePalette,
  renderSlideToSvg,
  type Palette,
  type SlideInput,
} from "@/lib/slide-renderer";

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

type PresentationContent = {
  meta?: { title?: string; subtitle?: string; palette?: Palette };
  title?: string;
  subtitle?: string;
  slides?: SlideInput[];
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
  const palette = useMemo(() => normalizePalette(content.meta?.palette), [content.meta?.palette]);
  const [images, setImages] = useState<Map<string, string | null>>(new Map());
  useEffect(() => {
    let cancelled = false;
    buildImageDataMap(slides).then((m) => {
      if (!cancelled) setImages(m);
    });
    return () => {
      cancelled = true;
    };
  }, [slides]);
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
        <SlideSvgCard
          key={i}
          index={i + 1}
          slide={s}
          palette={palette}
          imgData={s.imageUrl ? images.get(s.imageUrl) ?? null : null}
        />
      ))}
    </div>
  );
}

function SlideSvgCard({
  index,
  slide,
  palette,
  imgData,
}: {
  index: number;
  slide: SlideInput;
  palette: ReturnType<typeof normalizePalette>;
  imgData: string | null;
}) {
  const [svg, setSvg] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    renderSlideToSvg(slide, palette, imgData).then((s) => {
      if (!cancelled) setSvg(s);
    });
    return () => {
      cancelled = true;
    };
  }, [slide, palette, imgData]);
  const kind = slide.structured?.layout;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-3 py-1.5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Slide {index}
          {kind ? ` · ${kind}` : ""}
        </p>
        {slide.imageCredit && (
          <p className="text-[10px] text-muted-foreground">{slide.imageCredit}</p>
        )}
      </div>
      <div
        className="relative w-full bg-white"
        style={{ aspectRatio: "13.333 / 7.5" }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {slide.notes && (
        <details className="border-t border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Catatan pembicara</summary>
          <p className="mt-1 leading-relaxed">{slide.notes}</p>
        </details>
      )}
    </div>
  );
}
