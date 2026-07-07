import type { ReactNode } from "react";

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

type SlideContent = {
  title: string;
  layout: "section" | "content" | "two_column" | "quote" | "stats";
  bullets?: string[];
  bullets_right?: string[];
  stats?: { value: string; label: string }[];
  quote?: string;
  quote_source?: string;
  notes?: string;
};

type PresentationContent = {
  title?: string;
  subtitle?: string;
  agenda?: string[];
  closing?: { message?: string; cta?: string };
  slides?: SlideContent[];
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
  return (
    <div className="max-h-[600px] space-y-4 overflow-y-auto pr-1">
      <div className="rounded-xl border border-border bg-gradient-to-br from-foreground to-foreground/70 p-6 text-background shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">Cover</p>
        <h3 className="mt-2 text-lg font-semibold">{content.title}</h3>
        {content.subtitle && <p className="mt-1 text-[13px] opacity-80">{content.subtitle}</p>}
      </div>

      {content.agenda && content.agenda.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Agenda</p>
          <ul className="mt-2 list-decimal space-y-0.5 pl-5 text-[13px] text-foreground">
            {content.agenda.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {slides.map((s, i) => (
        <SlideCard key={i} index={i + 1} slide={s} />
      ))}

      {content.closing?.message && (
        <div className="rounded-xl border border-border bg-gradient-to-br from-foreground to-foreground/70 p-6 text-center text-background shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">Penutup</p>
          <p className="mt-2 text-base font-semibold">{content.closing.message}</p>
          {content.closing.cta && <p className="mt-1 text-[13px] opacity-80">{content.closing.cta}</p>}
        </div>
      )}
    </div>
  );
}

function SlideCard({ index, slide }: { index: number; slide: SlideContent }) {
  const isSection = slide.layout === "section";
  return (
    <div
      className={`rounded-xl border border-border p-5 shadow-sm ${
        isSection ? "bg-secondary" : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Slide {index} · {slide.layout}
        </p>
      </div>
      <h4
        className={`mt-1.5 font-semibold text-foreground ${
          isSection ? "text-lg" : "text-[14px]"
        }`}
      >
        {slide.title}
      </h4>

      {slide.layout === "quote" ? (
        <blockquote className="mt-3 border-l-2 border-foreground/40 pl-3 text-[13px] italic text-foreground">
          &ldquo;{slide.quote}&rdquo;
          {slide.quote_source && (
            <footer className="mt-1 text-[11px] not-italic text-muted-foreground">— {slide.quote_source}</footer>
          )}
        </blockquote>
      ) : slide.layout === "stats" && slide.stats ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slide.stats.map((st, i) => (
            <div key={i} className="rounded-lg border border-border p-2 text-center">
              <p className="text-lg font-bold text-foreground">{st.value}</p>
              <p className="text-[10px] text-muted-foreground">{st.label}</p>
            </div>
          ))}
        </div>
      ) : slide.layout === "two_column" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-foreground">
            {(slide.bullets ?? []).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-foreground">
            {(slide.bullets_right ?? []).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      ) : (
        (slide.bullets?.length ?? 0) > 0 && (
          <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[13px] text-foreground">
            {slide.bullets!.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )
      )}

      {slide.notes && (
        <details className="mt-3 rounded-md bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Catatan pembicara</summary>
          <p className="mt-1 leading-relaxed">{slide.notes}</p>
        </details>
      )}
    </div>
  );
}