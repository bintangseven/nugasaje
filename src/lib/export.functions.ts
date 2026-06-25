import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PaperContent = {
  title: string;
  course: string;
  kata_pengantar: string;
  abstract: string;
  sections: {
    heading: string;
    paragraphs: string[];
    subsections?: { heading: string; paragraphs: string[] }[];
  }[];
  conclusion: string;
  references: string[];
};

type PresentationContent = {
  title: string;
  subtitle: string;
  agenda: string[];
  closing: { message: string; cta?: string };
  slides: {
    title: string;
    layout: "section" | "content" | "two_column" | "quote" | "stats";
    bullets: string[];
    bullets_right?: string[];
    stats?: { value: string; label: string }[];
    quote?: string;
    quote_source?: string;
    notes: string;
  }[];
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]+/g, "").trim().slice(0, 60) || "student-os";
}

async function buildDocx(content: PaperContent, studentName: string): Promise<Uint8Array> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    PageBreak,
    TableOfContents,
    StyleLevel,
  } = await import("docx");

  const FONT = "Times New Roman";
  // half-points: 24 = 12pt, 28 = 14pt
  const BODY = 24;
  const H1 = 28;
  const H2 = 24;
  const H3 = 24;

  const bodyPara = (text: string, opts: { firstLine?: boolean; italic?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
    new Paragraph({
      alignment: opts.align ?? AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: 360 },
      indent: opts.firstLine ? { firstLine: 720 } : undefined,
      children: [new TextRun({ text, font: FONT, size: BODY, italics: opts.italic })],
    });

  const centerPara = (text: string, size: number, bold = false, spacing: { before?: number; after?: number } = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing,
      children: [new TextRun({ text, font: FONT, size, bold })],
    });

  const cover = [
    centerPara(content.title.toUpperCase(), 32, true, { before: 2400, after: 400 }),
    centerPara("MAKALAH", BODY, true, { after: 200 }),
    centerPara(`Mata Kuliah: ${content.course}`, BODY, false, { after: 1600 }),
    centerPara("Disusun oleh:", BODY, false, { after: 120 }),
    centerPara(studentName, BODY, true, { after: 1600 }),
    centerPara(
      new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      BODY,
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const h1 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 240 },
      children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: H1, bold: true })],
    });

  const h1Tight = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: H1, bold: true })],
    });

  const h2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, font: FONT, size: H2, bold: true })],
    });

  const h3 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text, font: FONT, size: H3, bold: true, italics: true })],
    });

  const kataPengantarBlock = [
    h1("Kata Pengantar"),
    ...content.kata_pengantar
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => bodyPara(p, { firstLine: true })),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const daftarIsiBlock = [
    h1("Daftar Isi"),
    new Paragraph({
      children: [
        new TableOfContents("Daftar Isi", {
          hyperlink: true,
          headingStyleRange: "1-3",
          stylesWithLevels: [
            new StyleLevel("Heading1", 1),
            new StyleLevel("Heading2", 2),
            new StyleLevel("Heading3", 3),
          ],
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const abstractBlock = [
    h1("Abstrak"),
    bodyPara(content.abstract, { italic: true, firstLine: true }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const sectionBlocks = content.sections.flatMap((s) => {
    const blocks: InstanceType<typeof Paragraph>[] = [
      new Paragraph({ children: [new PageBreak()] }),
    ];
    // Pisah "BAB I PENDAHULUAN" -> baris 1: "BAB I", baris 2: "PENDAHULUAN"
    const match = s.heading.match(/^(BAB\s+[IVXLCDM]+)\s+(.+)$/i);
    if (match) {
      blocks.push(h1(match[1]));
      blocks.push(h1Tight(match[2]));
    } else {
      blocks.push(h1(s.heading));
    }
    s.paragraphs.forEach((p) => blocks.push(bodyPara(p, { firstLine: true })));
    (s.subsections ?? []).forEach((sub) => {
      blocks.push(h2(sub.heading));
      sub.paragraphs.forEach((p) => blocks.push(bodyPara(p, { firstLine: true })));
    });
    return blocks;
  });

  const conclusion = [h1("Kesimpulan"), bodyPara(content.conclusion, { firstLine: true })];

  const references = [
    h1("Daftar Pustaka"),
    ...content.references.map(
      (r) =>
        new Paragraph({
          spacing: { after: 120, line: 360 },
          indent: { left: 720, hanging: 720 },
          children: [new TextRun({ text: r, font: FONT, size: BODY })],
        }),
    ),
  ];

  const doc = new Document({
    creator: "Student OS",
    title: content.title,
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: H1, bold: true },
          paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: H2, bold: true },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: H3, bold: true, italics: true },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            // Standar makalah: kiri 4cm (2268), atas 3cm (1701), kanan 3cm (1701), bawah 3cm (1701)
            margin: { top: 1701, right: 1701, bottom: 1701, left: 2268 },
          },
        },
        children: [
          ...cover,
          ...kataPengantarBlock,
          ...daftarIsiBlock,
          ...abstractBlock,
          ...sectionBlocks,
          ...conclusion,
          ...references,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

type Theme = {
  bg: string;
  surface: string;
  ink: string;
  inkInverse: string;
  muted: string;
  accent: string;
  accentSoft: string;
  headFont: string;
  bodyFont: string;
};

function pickTheme(style: string | undefined): Theme {
  const s = (style ?? "").toLowerCase();
  if (s.includes("kreatif")) {
    return {
      bg: "0F172A", surface: "FFFFFF", ink: "0F172A", inkInverse: "FFFFFF",
      muted: "64748B", accent: "F97316", accentSoft: "FED7AA",
      headFont: "Calibri", bodyFont: "Calibri",
    };
  }
  if (s.includes("semi")) {
    return {
      bg: "0E3A2F", surface: "FFFFFF", ink: "0F172A", inkInverse: "FFFFFF",
      muted: "64748B", accent: "2E8B6B", accentSoft: "CFE9DE",
      headFont: "Calibri", bodyFont: "Calibri",
    };
  }
  // default: Formal akademik
  return {
    bg: "1E2761", surface: "FFFFFF", ink: "0F172A", inkInverse: "FFFFFF",
    muted: "64748B", accent: "1E2761", accentSoft: "CADCFC",
    headFont: "Calibri", bodyFont: "Calibri",
  };
}

async function buildPptx(
  content: PresentationContent,
  studentName: string,
  meta: { course?: string; style?: string; audience?: string },
): Promise<Uint8Array> {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  const t = pickTheme(meta.style);

  // Slide dims (LAYOUT_WIDE = 13.333 x 7.5)
  const W = 13.333;
  const H = 7.5;

  type Slide = ReturnType<typeof pres.addSlide>;
  const SHAPES = pptxgen.ShapeType;

  const addFooter = (s: Slide, pageNo: number, totalNo: number) => {
    s.addShape(SHAPES.rect, {
      x: 0, y: H - 0.35, w: W, h: 0.05, fill: { color: t.accent }, line: { color: t.accent },
    });
    s.addText(content.title, {
      x: 0.5, y: H - 0.32, w: W - 2, h: 0.28,
      fontFace: t.bodyFont, fontSize: 10, color: t.muted, align: "left",
    });
    s.addText(`${pageNo} / ${totalNo}`, {
      x: W - 1.3, y: H - 0.32, w: 0.8, h: 0.28,
      fontFace: t.bodyFont, fontSize: 10, color: t.muted, align: "right",
    });
  };

  // ===== Cover =====
  const cover = pres.addSlide();
  cover.background = { color: t.bg };
  cover.addShape(SHAPES.rect, {
    x: 0.6, y: 1.6, w: 1.4, h: 0.12, fill: { color: t.accentSoft }, line: { color: t.accentSoft },
  });
  cover.addText("PRESENTASI", {
    x: 0.6, y: 1.85, w: 12, h: 0.4,
    fontFace: t.headFont, fontSize: 14, bold: true, color: t.accentSoft, charSpacing: 4,
  });
  cover.addText(content.title, {
    x: 0.6, y: 2.4, w: 12, h: 2.2,
    fontFace: t.headFont, fontSize: 48, bold: true, color: "FFFFFF", valign: "top",
  });
  cover.addText(content.subtitle || meta.course || "", {
    x: 0.6, y: 4.8, w: 12, h: 0.7,
    fontFace: t.bodyFont, fontSize: 22, color: t.accentSoft,
  });
  cover.addText(`Disusun oleh: ${studentName}`, {
    x: 0.6, y: H - 1.1, w: 12, h: 0.4,
    fontFace: t.bodyFont, fontSize: 14, color: "FFFFFF",
  });
  cover.addText(
    new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    { x: 0.6, y: H - 0.7, w: 12, h: 0.35, fontFace: t.bodyFont, fontSize: 12, color: t.accentSoft },
  );

  // ===== Agenda =====
  const agenda = pres.addSlide();
  agenda.background = { color: t.surface };
  agenda.addText("Agenda", {
    x: 0.6, y: 0.55, w: 12, h: 0.8,
    fontFace: t.headFont, fontSize: 36, bold: true, color: t.ink,
  });
  agenda.addShape(SHAPES.rect, {
    x: 0.6, y: 1.35, w: 0.7, h: 0.08, fill: { color: t.accent }, line: { color: t.accent },
  });
  content.agenda.forEach((item, i) => {
    const y = 1.9 + i * 0.85;
    agenda.addShape(SHAPES.ellipse, {
      x: 0.7, y, w: 0.55, h: 0.55, fill: { color: t.accent }, line: { color: t.accent },
    });
    agenda.addText(String(i + 1).padStart(2, "0"), {
      x: 0.7, y, w: 0.55, h: 0.55,
      fontFace: t.headFont, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle",
    });
    agenda.addText(item, {
      x: 1.5, y: y + 0.05, w: 11, h: 0.5,
      fontFace: t.bodyFont, fontSize: 20, color: t.ink, valign: "middle",
    });
  });

  // ===== Content slides =====
  const totalPages = 2 + content.slides.length + 1; // cover + agenda + slides + closing

  content.slides.forEach((slide, i) => {
    const s = pres.addSlide();
    const pageNo = 3 + i;

    if (slide.layout === "section") {
      s.background = { color: t.bg };
      s.addText(`BAGIAN ${String(i + 1).padStart(2, "0")}`, {
        x: 0.8, y: 2.6, w: 12, h: 0.5,
        fontFace: t.headFont, fontSize: 16, bold: true, color: t.accentSoft, charSpacing: 6,
      });
      s.addText(slide.title, {
        x: 0.8, y: 3.1, w: 12, h: 2,
        fontFace: t.headFont, fontSize: 44, bold: true, color: "FFFFFF",
      });
      s.addShape(SHAPES.rect, {
        x: 0.8, y: 5.2, w: 1.6, h: 0.08, fill: { color: t.accent }, line: { color: t.accent },
      });
      if (slide.notes) s.addNotes(slide.notes);
      addFooter(s, pageNo, totalPages);
      return;
    }

    // Common header for non-section slides
    s.background = { color: t.surface };
    s.addText(slide.title, {
      x: 0.6, y: 0.5, w: W - 1.2, h: 0.8,
      fontFace: t.headFont, fontSize: 28, bold: true, color: t.ink,
    });
    s.addShape(SHAPES.rect, {
      x: 0.6, y: 1.25, w: 0.7, h: 0.07, fill: { color: t.accent }, line: { color: t.accent },
    });

    if (slide.layout === "two_column") {
      const colW = (W - 1.4) / 2;
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
        {
          x: 0.6, y: 1.7, w: colW, h: H - 2.5,
          fontFace: t.bodyFont, fontSize: 18, color: t.ink, valign: "top", paraSpaceAfter: 8,
        },
      );
      s.addText(
        (slide.bullets_right ?? []).map((b) => ({ text: b, options: { bullet: true } })),
        {
          x: 0.6 + colW + 0.2, y: 1.7, w: colW, h: H - 2.5,
          fontFace: t.bodyFont, fontSize: 18, color: t.ink, valign: "top", paraSpaceAfter: 8,
        },
      );
    } else if (slide.layout === "stats") {
      const stats = slide.stats ?? [];
      const n = Math.max(1, stats.length);
      const gap = 0.3;
      const cardW = (W - 1.2 - gap * (n - 1)) / n;
      stats.forEach((st, idx) => {
        const x = 0.6 + idx * (cardW + gap);
        s.addShape(SHAPES.roundRect, {
          x, y: 2.1, w: cardW, h: 3.6, fill: { color: t.accentSoft }, line: { color: t.accentSoft }, rectRadius: 0.12,
        });
        s.addText(st.value, {
          x, y: 2.4, w: cardW, h: 2,
          fontFace: t.headFont, fontSize: 60, bold: true, color: t.accent, align: "center", valign: "middle",
        });
        s.addText(st.label, {
          x: x + 0.2, y: 4.4, w: cardW - 0.4, h: 1.1,
          fontFace: t.bodyFont, fontSize: 16, color: t.ink, align: "center", valign: "top",
        });
      });
    } else if (slide.layout === "quote") {
      s.addText(`"${slide.quote ?? slide.bullets.join(" ")}"`, {
        x: 1.2, y: 2.2, w: W - 2.4, h: 3,
        fontFace: t.headFont, fontSize: 30, italic: true, bold: true, color: t.ink, align: "center", valign: "middle",
      });
      if (slide.quote_source) {
        s.addText(`— ${slide.quote_source}`, {
          x: 1.2, y: 5.4, w: W - 2.4, h: 0.5,
          fontFace: t.bodyFont, fontSize: 16, color: t.muted, align: "center",
        });
      }
    } else {
      // content (default)
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
        {
          x: 0.7, y: 1.7, w: W - 1.4, h: H - 2.5,
          fontFace: t.bodyFont, fontSize: 20, color: t.ink, valign: "top", paraSpaceAfter: 10,
        },
      );
    }

    if (slide.notes) s.addNotes(slide.notes);
    addFooter(s, pageNo, totalPages);
  });

  // ===== Closing =====
  const closing = pres.addSlide();
  closing.background = { color: t.bg };
  closing.addText(content.closing.message || "Terima Kasih", {
    x: 0.6, y: 2.8, w: 12, h: 1.4,
    fontFace: t.headFont, fontSize: 60, bold: true, color: "FFFFFF", align: "center",
  });
  if (content.closing.cta) {
    closing.addText(content.closing.cta, {
      x: 1, y: 4.4, w: W - 2, h: 0.8,
      fontFace: t.bodyFont, fontSize: 20, color: t.accentSoft, align: "center",
    });
  }
  closing.addText(studentName, {
    x: 0.6, y: H - 1, w: 12, h: 0.4,
    fontFace: t.bodyFont, fontSize: 14, color: t.accentSoft, align: "center",
  });

  const out = (await pres.write({ outputType: "uint8array" })) as Uint8Array;
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // btoa is available in workerd
  return btoa(bin);
}

export const exportProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase
      .from("projects")
      .select("id,name,mission,ai_context,answers")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Proyek tidak ditemukan");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("name")
      .eq("id", context.userId)
      .maybeSingle();
    const studentName = profile?.name ?? "Mahasiswa";

    const ctx = project.ai_context as { kind?: string; content?: unknown } | null;
    if (!ctx?.content) throw new Error("Konten AI belum dihasilkan.");

    const baseName = sanitizeFilename(project.name);

    if (project.mission === "paper") {
      const bytes = await buildDocx(ctx.content as PaperContent, studentName);
      return {
        base64: toBase64(bytes),
        filename: `${baseName}.docx`,
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }

    const answers = (project.answers ?? {}) as Record<string, string>;
    const bytes = await buildPptx(ctx.content as PresentationContent, studentName, {
      course: answers.course,
      style: answers.style,
      audience: answers.audience,
    });
    return {
      base64: toBase64(bytes),
      filename: `${baseName}.pptx`,
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  });