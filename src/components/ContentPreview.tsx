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
  return (
    <div className="max-h-[600px] space-y-4 overflow-y-auto pr-1">
