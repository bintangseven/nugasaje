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
        <h3 className="text-sm font-semibold text-foreground">Pilih kombinasi warna</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Hanya palet warna — Claude yang akan mendesain cover & tiap slide otomatis.
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
              <PalettePreview tpl={tpl} />
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

function PalettePreview({ tpl }: { tpl: PptxTemplate }) {
  const t = tpl.theme;
  const swatches = [t.bg, t.accent, t.accentSoft, t.bg2, t.surface];
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: hex(t.surface) }}>
      <div className="absolute inset-0 flex">
        {swatches.map((c, idx) => (
          <div key={idx} className="flex-1" style={{ background: hex(c) }} />
        ))}
      </div>
      <div
        className="absolute inset-x-2 bottom-2 rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
        style={{ background: hex(t.bg), color: hex(t.accentSoft) }}
      >
        Palette
      </div>
    </div>
  );
}