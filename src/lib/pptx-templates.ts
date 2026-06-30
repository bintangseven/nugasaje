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

export type PptxTemplate = {
  id: string;
  name: string;
  vibe: string;
  description: string;
  cover: CoverStyle;
  theme: PptxTheme;
};

export const pptxTemplates: PptxTemplate[] = [
  {
    id: "lovable",
    name: "Lovable Launch",
    vibe: "Modern · Dark",
    description: "Dark deck dengan aksen pink + ungu, tipografi besar. Vibe product launch & startup.",
    cover: "lovable",
    theme: {
      bg: "0E0E16", bg2: "16151F", surface: "F5F3FB",
      ink: "16151F", inkInverse: "FFFFFF", muted: "6B6A7C",
      accent: "FF3D7F", accentSoft: "7C5CFC",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "ingoude",
    name: "Ingoude Bold",
    vibe: "Korporat · Triangle",
    description: "Navy + amber dengan aksen segitiga. Cocok untuk kick-off, sidang, & rapat tim.",
    cover: "ingoude",
    theme: {
      bg: "1E3A8A", bg2: "F5B82E", surface: "FFFFFF",
      ink: "0F1E4D", inkInverse: "FFFFFF", muted: "5B6A8A",
      accent: "1E3A8A", accentSoft: "F5B82E",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "midnight",
    name: "Midnight Executive",
    vibe: "Formal · Korporat",
    description: "Navy klasik dengan aksen es-biru. Cocok untuk sidang & dosen formal.",
    cover: "solid",
    theme: {
      bg: "0B1437", bg2: "1E2761", surface: "FFFFFF",
      ink: "0F172A", inkInverse: "FFFFFF", muted: "64748B",
      accent: "4F7CFF", accentSoft: "CADCFC",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "coral",
    name: "Coral Sunrise",
    vibe: "Energik · Modern",
    description: "Gradasi coral → emas dengan tipografi besar. Membuat audiens melek.",
    cover: "gradient",
    theme: {
      bg: "F96167", bg2: "F9E795", surface: "FFFFFF",
      ink: "2F3C7E", inkInverse: "FFFFFF", muted: "6B7280",
      accent: "F96167", accentSoft: "FFE3D2",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "forest",
    name: "Forest Calm",
    vibe: "Organik · Tenang",
    description: "Hijau forest + cream. Pas untuk topik lingkungan, sosial, riset lapangan.",
    cover: "split",
    theme: {
      bg: "2C5F2D", bg2: "97BC62", surface: "F7F5EE",
      ink: "1F2D1F", inkInverse: "FFFFFF", muted: "5E6B5E",
      accent: "2C5F2D", accentSoft: "DDE7C7",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "minimal",
    name: "Charcoal Minimal",
    vibe: "Minimal · Bersih",
    description: "Putih bersih dengan aksen arang. Fokus penuh ke isi, tanpa distraksi.",
    cover: "minimal",
    theme: {
      bg: "F2F2F2", bg2: "FFFFFF", surface: "FFFFFF",
      ink: "1A1A1A", inkInverse: "FFFFFF", muted: "6B7280",
      accent: "212121", accentSoft: "E5E5E5",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "editorial",
    name: "Berry Editorial",
    vibe: "Editorial · Majalah",
    description: "Tipografi besar, kombinasi berry + dusty rose. Vibe artikel magazine.",
    cover: "editorial",
    theme: {
      bg: "ECE2D0", bg2: "A26769", surface: "FBF7F0",
      ink: "3A1F25", inkInverse: "FFFFFF", muted: "8A6F6A",
      accent: "6D2E46", accentSoft: "E8D2D5",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "teal",
    name: "Teal Trust",
    vibe: "Profesional · Segar",
    description: "Teal seafoam dengan band horizontal. Profesional tapi tidak kaku.",
    cover: "band",
    theme: {
      bg: "FFFFFF", bg2: "028090", surface: "FFFFFF",
      ink: "0E2A33", inkInverse: "FFFFFF", muted: "6B7B80",
      accent: "028090", accentSoft: "B7E4DE",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "cherry",
    name: "Cherry Bold",
    vibe: "Bold · Kontras",
    description: "Cherry merah + cream + navy. Statement kuat, gampang dipresentasikan.",
    cover: "geometric",
    theme: {
      bg: "FCF6F5", bg2: "990011", surface: "FCF6F5",
      ink: "1A1A2E", inkInverse: "FFFFFF", muted: "6B7280",
      accent: "990011", accentSoft: "F5D7DB",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
  {
    id: "duotone",
    name: "Sunset Duotone",
    vibe: "Kreatif · Gradient",
    description: "Gradient ungu → pink di slide gelap. Cocok presentasi kreatif & startup.",
    cover: "duotone",
    theme: {
      bg: "1B0A3A", bg2: "E94560", surface: "F7F3FF",
      ink: "1B0A3A", inkInverse: "FFFFFF", muted: "6B7280",
      accent: "E94560", accentSoft: "F2BED1",
      headFont: "Calibri", bodyFont: "Calibri",
    },
  },
];

export const DEFAULT_TEMPLATE_ID = "lovable";

export function getTemplate(id: string | undefined | null): PptxTemplate {
  return (
    pptxTemplates.find((t) => t.id === id) ??
    pptxTemplates.find((t) => t.id === DEFAULT_TEMPLATE_ID)!
  );
}