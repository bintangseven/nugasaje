/**
 * Preset format dokumen kampus.
 * Nilai disimpan sebagai string di kolom `answers` proyek (mis. format_font)
 * supaya kompatibel dengan validator ProjectPatch yang bertipe Record<string,string>.
 */

export type DocFormat = {
  preset: string;
  font: string;
  fontSize: number; // pt
  lineSpacing: number; // multiplier
  marginTop: number; // cm
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  cover: "kampus" | "minimalis" | "tanpa";
};

export const FONT_OPTIONS = ["Times New Roman", "Arial", "Calibri", "Cambria", "Garamond"];
export const SIZE_OPTIONS = [10, 11, 12, 14];
export const SPACING_OPTIONS = [1, 1.15, 1.5, 2];

export const DOC_PRESETS: Record<string, { label: string; labelEn: string; value: Omit<DocFormat, "preset"> }> = {
  kampus: {
    label: "Standar Kampus Indonesia (4-4-3-3, TNR 12, spasi 1.5)",
    labelEn: "Indonesian Campus Standard (4-4-3-3, TNR 12, 1.5 spacing)",
    value: {
      font: "Times New Roman",
      fontSize: 12,
      lineSpacing: 1.5,
      marginTop: 4,
      marginLeft: 4,
      marginRight: 3,
      marginBottom: 3,
      cover: "kampus",
    },
  },
  apa: {
    label: "APA 7th (margin 2.54 cm, TNR 12, spasi 2)",
    labelEn: "APA 7th (2.54 cm margins, TNR 12, double spacing)",
    value: {
      font: "Times New Roman",
      fontSize: 12,
      lineSpacing: 2,
      marginTop: 2.54,
      marginLeft: 2.54,
      marginRight: 2.54,
      marginBottom: 2.54,
      cover: "minimalis",
    },
  },
  ringkas: {
    label: "Ringkas / Tugas Harian (margin 3 cm, Arial 11, spasi 1.15)",
    labelEn: "Compact / Weekly Assignment (3 cm margins, Arial 11, 1.15 spacing)",
    value: {
      font: "Arial",
      fontSize: 11,
      lineSpacing: 1.15,
      marginTop: 3,
      marginLeft: 3,
      marginRight: 3,
      marginBottom: 3,
      cover: "minimalis",
    },
  },
  custom: {
    label: "Kustom (atur sendiri)",
    labelEn: "Custom (set your own)",
    value: {
      font: "Times New Roman",
      fontSize: 12,
      lineSpacing: 1.5,
      marginTop: 4,
      marginLeft: 4,
      marginRight: 3,
      marginBottom: 3,
      cover: "kampus",
    },
  },
};

export const DEFAULT_DOC_FORMAT: DocFormat = { preset: "kampus", ...DOC_PRESETS.kampus.value };

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Baca konfigurasi format dari map `answers` proyek. */
export function readDocFormat(answers: Record<string, string> | null | undefined): DocFormat {
  const a = answers ?? {};
  const presetKey = a.format_preset && DOC_PRESETS[a.format_preset] ? a.format_preset : "kampus";
  const base = DOC_PRESETS[presetKey].value;
  if (presetKey !== "custom") return { preset: presetKey, ...base };
  const cover = a.format_cover;
  return {
    preset: "custom",
    font: a.format_font || base.font,
    fontSize: num(a.format_size, base.fontSize),
    lineSpacing: num(a.format_spacing, base.lineSpacing),
    marginTop: num(a.format_margin_top, base.marginTop),
    marginRight: num(a.format_margin_right, base.marginRight),
    marginBottom: num(a.format_margin_bottom, base.marginBottom),
    marginLeft: num(a.format_margin_left, base.marginLeft),
    cover: cover === "minimalis" || cover === "tanpa" ? cover : base.cover,
  };
}

/** Ubah konfigurasi jadi map string untuk disimpan ke `answers`. */
export function writeDocFormat(f: DocFormat): Record<string, string> {
  return {
    format_preset: f.preset,
    format_font: f.font,
    format_size: String(f.fontSize),
    format_spacing: String(f.lineSpacing),
    format_margin_top: String(f.marginTop),
    format_margin_right: String(f.marginRight),
    format_margin_bottom: String(f.marginBottom),
    format_margin_left: String(f.marginLeft),
    format_cover: f.cover,
  };
}

export const CM_TO_TWIP = 567;
export const PT_TO_HALFPT = 2;
