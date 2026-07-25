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
    blocks?: PaperBlock[];
    subsections?: { heading: string; paragraphs: string[]; blocks?: PaperBlock[] }[];
  }[];
  conclusion: string;
  references: string[];
};

type PaperBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] };

type SlideBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] };

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
    LevelFormat,
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

  // Ganti bullet dot dengan penomoran huruf kecil (a. b. c. …) sesuai
  // konvensi makalah Indonesia. Numbering dikonfigurasi di Document.numbering.
  const bulletPara = (text: string) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80, line: 340 },
      numbering: { reference: "abc-list", level: 0 },
      children: [new TextRun({ text, font: FONT, size: BODY })],
    });

  const renderBlocks = (
    blocks: PaperBlock[] | undefined,
    fallbackParas: string[],
  ): InstanceType<typeof Paragraph>[] => {
    if (blocks && blocks.length > 0) {
      const out: InstanceType<typeof Paragraph>[] = [];
      for (const b of blocks) {
        if (b.kind === "paragraph" && b.text?.trim()) {
          out.push(bodyPara(b.text, { firstLine: true }));
        } else if (b.kind === "bullets" && Array.isArray(b.items)) {
          for (const it of b.items) {
            if (it?.trim()) out.push(bulletPara(it));
          }
        }
      }
      if (out.length > 0) return out;
    }
    return fallbackParas.map((p) => bodyPara(p, { firstLine: true }));
  };

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

  const h1 = (text: string, opts: { pageBreakBefore?: boolean } = {}) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 240 },
      pageBreakBefore: opts.pageBreakBefore,
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
    h1("Kata Pengantar", { pageBreakBefore: true }),
    ...content.kata_pengantar
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => bodyPara(p, { firstLine: true })),
  ];

  // TOC ditempatkan sebagai block-level element langsung di section
  // (bukan di dalam Paragraph) agar Word mengenalinya sebagai field TOC
  // yang bisa di-Update Field (F9) untuk memperbaharui nomor halaman.
  const daftarIsiBlock = [
    h1("Daftar Isi", { pageBreakBefore: true }),
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: [
        new StyleLevel("Heading1", 1),
        new StyleLevel("Heading2", 2),
        new StyleLevel("Heading3", 3),
      ],
    }),
  ];

  const abstractBlock = [
    h1("Abstrak", { pageBreakBefore: true }),
    bodyPara(content.abstract, { italic: true, firstLine: true }),
  ];

  const sectionBlocks = content.sections.flatMap((s) => {
    const blocks: InstanceType<typeof Paragraph>[] = [];
    // Pisah "BAB I PENDAHULUAN" -> baris 1: "BAB I", baris 2: "PENDAHULUAN"
    const match = s.heading.match(/^(BAB\s+[IVXLCDM]+)\s+(.+)$/i);
    if (match) {
      blocks.push(h1(match[1], { pageBreakBefore: true }));
      blocks.push(h1Tight(match[2]));
    } else {
      blocks.push(h1(s.heading, { pageBreakBefore: true }));
    }
    renderBlocks(s.blocks, s.paragraphs).forEach((b) => blocks.push(b));
    (s.subsections ?? []).forEach((sub) => {
      blocks.push(h2(sub.heading));
      renderBlocks(sub.blocks, sub.paragraphs).forEach((b) => blocks.push(b));
    });
    return blocks;
  });

  const conclusion = [
    h1("Kesimpulan", { pageBreakBefore: true }),
    bodyPara(content.conclusion, { firstLine: true }),
  ];

  const references = [
    h1("Daftar Pustaka", { pageBreakBefore: true }),
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
    creator: "Numu AI",
    title: content.title,
    numbering: {
      config: [
        {
          reference: "abc-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.LOWER_LETTER,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
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

    const ctx = project.ai_context as {
      kind?: string;
      content?: unknown;
    } | null;
    if (!ctx?.content) {
      // Self-heal: project is marked done but the AI payload is missing
      // (older row, partial write, or generation failure). Reset to interview
      // so the user can click "Mulai kerjakan" again.
      await context.supabase
        .from("projects")
        .update({ phase: "interview", step_index: -1, progress: 25 })
        .eq("id", data.id);
      throw new Error(
        "Konten AI belum tersimpan untuk proyek ini. Klik 'Mulai kerjakan' sekali lagi untuk membuat ulang.",
      );
    }

    const baseName = sanitizeFilename(project.name);

    if (project.mission === "paper") {
      const bytes = await buildDocx(ctx.content as PaperContent, studentName);
      return {
        base64: toBase64(bytes),
        filename: `${baseName}.docx`,
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }

    // Presentasi selalu di-render via pptxgenjs (Beautiful.ai nonaktif sementara).
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