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

const COLOR_KEYS = [
  "bg",
  "bg2",
  "surface",
  "ink",
  "inkInverse",
  "muted",
  "accent",
  "accentSoft",
] as const;

type ColorKey = (typeof COLOR_KEYS)[number];

/**
 * Normalizes a hex color string.
 * - Trims whitespace before stripping "#" (order matters: " #fff" would
 *   otherwise fail the leading "#" strip).
 * - Accepts 3-digit shorthand (e.g. "FFF" -> "FFFFFF").
 * - Falls back to `fallback` on anything else, logging why so a bad
 *   AI-generated palette doesn't fail silently.
 */
export function normHex(v: string | undefined, fallback: string, key?: string): string {
  if (!v) return fallback;

  const cleaned = v.trim().replace(/^#/, "");

  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
    return expanded.toUpperCase();
  }

  console.warn(
    `[pptxTheme] Invalid hex "${v}"${key ? ` for "${key}"` : ""}, falling back to "${fallback}".`
  );
  return fallback;
}

// --- Contrast checking (WCAG relative luminance) ---------------------------

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Standard WCAG contrast ratio between two hex colors (1 to 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * If `fg` doesn't contrast against `bg` enough for body text (WCAG AA,
 * ratio >= 4.5), swap in `altFg` instead. Prevents e.g. light ink on a
 * light background from slipping through unnoticed.
 */
function ensureContrast(fg: string, bg: string, altFg: string, label: string): string {
  const ratio = contrastRatio(fg, bg);
  if (ratio < 4.5) {
    console.warn(
      `[pptxTheme] "${label}" contrast against its background is too low (${ratio.toFixed(
        2
      )}:1). Using inverse ink instead.`
    );
    return altFg;
  }
  return fg;
}

export function resolveTheme(input: Partial<PptxTheme> | undefined | null): PptxTheme {
  const d = DEFAULT_THEME;

  const colors = Object.fromEntries(
    COLOR_KEYS.map((key: ColorKey) => [key, normHex(input?.[key], d[key], key)])
  ) as Pick<PptxTheme, ColorKey>;

  // Guard against low-contrast text: ink is meant to sit on `surface`,
  // inkInverse is meant to sit on `bg`.
  colors.ink = ensureContrast(colors.ink, colors.surface, colors.inkInverse, "ink");
  colors.inkInverse = ensureContrast(colors.inkInverse, colors.bg, colors.ink, "inkInverse");

  // Guard against an accent that's invisible against its own background.
  if (contrastRatio(colors.accent, colors.bg) < 1.5 && contrastRatio(colors.accent, colors.surface) < 1.5) {
    console.warn(
      `[pptxTheme] "accent" (${colors.accent}) barely contrasts against bg/surface — consider a different accent.`
    );
  }

  return {
    ...colors,
    headFont: input?.headFont?.trim() || d.headFont,
    bodyFont: input?.bodyFont?.trim() || d.bodyFont,
  };
}
