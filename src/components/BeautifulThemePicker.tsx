import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { listBeautifulThemes } from "@/lib/beautiful.functions";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// Swatch warna kasar per theme bawaan Beautiful.ai (estimasi visual).
const SWATCH: Record<string, [string, string, string]> = {
  bold: ["#0F172A", "#F97316", "#FACC15"],
  cheeky: ["#FDF2F8", "#EC4899", "#F472B6"],
  classic: ["#FFFFFF", "#1E293B", "#64748B"],
  dark: ["#0B0B0F", "#22D3EE", "#A78BFA"],
  daybreak: ["#FFF7ED", "#FB923C", "#F59E0B"],
  discovery: ["#FEF3C7", "#10B981", "#F59E0B"],
  ember: ["#1C1917", "#EA580C", "#FBBF24"],
  horizon: ["#E0F2FE", "#0284C7", "#38BDF8"],
  inc: ["#F8FAFC", "#0F172A", "#3B82F6"],
  luminary: ["#FAFAF9", "#A855F7", "#22D3EE"],
  magazine: ["#FFFFFF", "#111827", "#DC2626"],
  minimal: ["#FFFFFF", "#111827", "#9CA3AF"],
  museum: ["#F5F5F4", "#1C1917", "#A8A29E"],
  space: ["#020617", "#6366F1", "#22D3EE"],
  spritz: ["#ECFEFF", "#06B6D4", "#A3E635"],
};

function fallbackSwatch(id: string): [string, string, string] {
  // Hash sederhana → 3 warna pastel acak yang stabil per id
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return [
    `hsl(${hue} 30% 95%)`,
    `hsl(${(hue + 30) % 360} 60% 45%)`,
    `hsl(${(hue + 180) % 360} 60% 55%)`,
  ];
}

export function BeautifulThemePicker({ value, onChange }: Props) {
  const fn = useServerFn(listBeautifulThemes);
  const q = useQuery({
    queryKey: ["beautiful-themes"],
    queryFn: () => fn({}),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Pilih tema Beautiful.ai</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tema desain bawaan Beautiful.ai akan dipakai saat menyusun slide.
        </p>
      </div>

      {q.isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Memuat tema…
        </div>
      )}

      {q.data && q.data.themes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Tidak ada tema tersedia. Akan dipakai tema default workspace.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(q.data?.themes ?? []).map((t) => {
          const selected = t.id === value;
          const [c1, c2, c3] = SWATCH[t.id] ?? fallbackSwatch(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`group relative overflow-hidden rounded-xl border bg-card text-left transition-all ${
                selected
                  ? "border-foreground shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="relative aspect-[16/9] w-full" style={{ background: c1 }}>
                <div className="absolute left-2 top-2 h-1.5 w-6 rounded-full" style={{ background: c2 }} />
                <div
                  className="absolute left-2 top-5 right-8 text-[10px] font-bold leading-tight"
                  style={{ color: c2 }}
                >
                  {t.name}
                </div>
                <div
                  className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full opacity-80"
                  style={{ background: c3 }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <p className="truncate text-[11px] font-semibold text-foreground">{t.name}</p>
                {selected && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <p className="px-2.5 pb-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                {t.source === "built_in" ? "Bawaan" : t.source === "team" ? "Tim" : "Saya"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}