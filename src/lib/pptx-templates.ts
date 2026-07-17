export type PptxTheme = {
  bg: string;
  bg2: string;
  surface: string;
  ink: string;
  inkInverse: string;
  muted: string;
  accent: string;
  accentSoft: string;
  headFont: string;
  bodyFont: string;
};

export type CoverStyle =
  | "solid"
  | "gradient"
  | "split"
  | "geometric"
  | "minimal"
  | "editorial"
  | "band"
  | "duotone"
  | "ingoude"
  | "lovable";

// Fallback theme used only when Claude does not supply its own palette.
// Semua pilihan template dihilangkan — Claude sekarang mendesain warna sendiri.
export const DEFAULT_THEME: PptxTheme = {
  bg: "0E0E16",
  bg2: "16151F",
  surface: "F5F3FB",
  ink: "16151F",
  inkInverse: "FFFFFF",
  muted: "6B6A7C",
  accent: "FF3D7F",
  accentSoft: "7C5CFC",
  headFont: "Calibri",
  bodyFont: "Calibri",
};

function normHex(v: string | undefined, fallback: string): string {
  if (!v) return fallback;
  const cleaned = v.replace(/^#/, "").trim();
  return /^[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned.toUpperCase() : fallback;
}

export function resolveTheme(input: Partial<PptxTheme> | undefined | null): PptxTheme {
  const d = DEFAULT_THEME;
  return {
    bg: normHex(input?.bg, d.bg),
    bg2: normHex(input?.bg2, d.bg2),
    surface: normHex(input?.surface, d.surface),
    ink: normHex(input?.ink, d.ink),
    inkInverse: normHex(input?.inkInverse, d.inkInverse),
    muted: normHex(input?.muted, d.muted),
    accent: normHex(input?.accent, d.accent),
    accentSoft: normHex(input?.accentSoft, d.accentSoft),
    headFont: input?.headFont || d.headFont,
    bodyFont: input?.bodyFont || d.bodyFont,
  };
}