import { Check } from "lucide-react";
import { pptxTemplates, type PptxTemplate } from "@/lib/pptx-templates";

interface TemplatePickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Pilih template slide</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tema warna & tata letak cover akan dipakai di file .pptx kamu.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pptxTemplates.map((tpl) => {
          const selected = tpl.id === value;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onChange(tpl.id)}
              className={`group relative overflow-hidden rounded-xl border bg-card text-left transition-all ${
                selected
                  ? "border-foreground shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <TemplatePreview tpl={tpl} />
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-foreground">{tpl.name}</p>
                  {selected && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tpl.vibe}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function hex(c: string) {
  return `#${c}`;
}

function TemplatePreview({ tpl }: { tpl: PptxTemplate }) {
  const t = tpl.theme;
  const baseBg = hex(t.bg);
  const bg2 = hex(t.bg2);
  const surface = hex(t.surface);
  const ink = hex(t.ink);
  const accent = hex(t.accent);
  const accentSoft = hex(t.accentSoft);
  const muted = hex(t.muted);

  const Wrapper = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div className="relative aspect-[16/9] w-full overflow-hidden" style={style}>
      {children}
    </div>
  );

  switch (tpl.cover) {
    case "gradient":
      return (
        <Wrapper style={{ background: `linear-gradient(135deg, ${baseBg}, ${bg2})` }}>
          <div className="absolute left-2 top-2 text-[5px] font-bold tracking-[0.15em] text-white/80">PRESENTASI</div>
          <div className="absolute left-2 top-4 right-2 text-[10px] font-bold leading-tight text-white">
            Judul Presentasi
          </div>
          <div className="absolute bottom-2 left-2 text-[5px] text-white/70">Mata Kuliah</div>
        </Wrapper>
      );
    case "split":
      return (
        <Wrapper style={{ background: surface }}>
          <div className="absolute inset-y-0 left-0 w-[42%]" style={{ background: baseBg }} />
          <div className="absolute left-[33%] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ background: bg2 }} />
          <div className="absolute right-2 top-3 left-[46%] text-[9px] font-bold leading-tight" style={{ color: ink }}>
            Judul
          </div>
          <div className="absolute right-2 bottom-2 left-[46%] text-[5px]" style={{ color: muted }}>
            Mata Kuliah
          </div>
        </Wrapper>
      );
    case "minimal":
      return (
        <Wrapper style={{ background: baseBg }}>
          <div className="absolute left-2 top-2 h-[2px] w-3" style={{ background: accent }} />
          <div className="absolute left-2 top-3 text-[5px] font-bold tracking-[0.18em]" style={{ color: accent }}>
            PRESENTASI
          </div>
          <div className="absolute left-2 top-5 right-2 text-[11px] font-bold leading-tight" style={{ color: ink }}>
            Judul
          </div>
          <div className="absolute bottom-2 left-2 text-[5px]" style={{ color: muted }}>Mata Kuliah</div>
        </Wrapper>
      );
    case "editorial":
      return (
        <Wrapper style={{ background: baseBg }}>
          <div className="absolute left-2 top-2 text-[4px] font-bold tracking-[0.15em]" style={{ color: accent }}>VOL. 01</div>
          <div className="absolute right-2 top-2 text-[4px] font-bold tracking-[0.15em]" style={{ color: accent }}>2026</div>
          <div className="absolute left-2 right-2 top-3.5 h-px" style={{ background: accent }} />
          <div className="absolute left-2 right-2 top-4 text-[12px] font-bold italic leading-tight" style={{ color: ink }}>
            Judul
          </div>
          <div className="absolute bottom-1.5 left-2 text-[5px] italic" style={{ color: accent }}>Mata Kuliah</div>
        </Wrapper>
      );
    case "band":
      return (
        <Wrapper style={{ background: surface }}>
          <div className="absolute inset-x-0 top-[32%] h-[36%]" style={{ background: bg2 }} />
          <div className="absolute left-2 top-[36%] text-[5px] font-bold tracking-[0.15em] text-white/90">PRESENTASI</div>
          <div className="absolute left-2 top-[44%] right-2 text-[10px] font-bold leading-tight text-white">Judul</div>
          <div className="absolute bottom-1.5 left-2 text-[5px]" style={{ color: ink }}>Mata Kuliah</div>
        </Wrapper>
      );
    case "geometric":
      return (
        <Wrapper style={{ background: surface }}>
          <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full" style={{ background: accent }} />
          <div className="absolute -bottom-3 -left-3 h-8 w-8 rounded-full" style={{ background: accentSoft }} />
          <div className="absolute left-2 top-2 text-[5px] font-bold tracking-[0.15em]" style={{ color: accent }}>
            PRESENTASI
          </div>
          <div className="absolute left-2 top-4 right-12 text-[11px] font-bold leading-tight" style={{ color: ink }}>
            Judul
          </div>
          <div className="absolute bottom-2 left-2 text-[5px]" style={{ color: muted }}>Mata Kuliah</div>
        </Wrapper>
      );
    case "duotone":
      return (
        <Wrapper style={{ background: `linear-gradient(120deg, ${baseBg} 45%, ${bg2})` }}>
          <div className="absolute left-[28%] top-[18%] h-10 w-10 rounded-full opacity-70" style={{ background: accent }} />
          <div className="absolute left-2 top-2 text-[5px] font-bold tracking-[0.18em]" style={{ color: accentSoft }}>
            PRESENTASI
          </div>
          <div className="absolute left-2 top-4 right-2 text-[10px] font-bold leading-tight text-white">Judul</div>
          <div className="absolute bottom-2 left-2 text-[5px]" style={{ color: accentSoft }}>Mata Kuliah</div>
        </Wrapper>
      );
    case "solid":
    default:
      return (
        <Wrapper style={{ background: baseBg }}>
          <div className="absolute left-2 top-3 h-[2px] w-3" style={{ background: accentSoft }} />
          <div className="absolute left-2 top-4 text-[5px] font-bold tracking-[0.15em]" style={{ color: accentSoft }}>
            PRESENTASI
          </div>
          <div className="absolute left-2 top-6 right-2 text-[10px] font-bold leading-tight text-white">Judul</div>
          <div className="absolute bottom-2 left-2 text-[5px]" style={{ color: accentSoft }}>Mata Kuliah</div>
        </Wrapper>
      );
  }
}