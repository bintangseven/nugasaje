import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PaperContent = {
  title: string;
  course: string;
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
  slides: { title: string; bullets: string[]; notes: string }[];
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

  const h2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, font: FONT, size: H2, bold: true })],
    });

  const h3 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text, font: FONT, size: H3, bold: true, italics: true })],
    });

  const abstractBlock = [
    h1("Abstrak"),
    bodyPara(content.abstract, { italic: true, firstLine: true }),
  ];

  const sectionBlocks = content.sections.flatMap((s) => {
    const blocks: InstanceType<typeof Paragraph>[] = [h1(s.heading)];
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
        children: [...cover, ...abstractBlock, ...sectionBlocks, ...conclusion, ...references],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

async function buildPptx(content: PresentationContent, studentName: string): Promise<Uint8Array> {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  const accent = "1E2761";
  const ink = "0F172A";
  const muted = "64748B";

  // Cover
  const cover = pres.addSlide();
  cover.background = { color: accent };
  cover.addText(content.title, {
    x: 0.6, y: 2.4, w: 12, h: 1.6,
    fontFace: "Calibri", fontSize: 44, bold: true, color: "FFFFFF",
  });
  cover.addText(content.subtitle, {
    x: 0.6, y: 4.1, w: 12, h: 0.8,
    fontFace: "Calibri", fontSize: 22, color: "CADCFC",
  });
  cover.addText(studentName, {
    x: 0.6, y: 6.4, w: 12, h: 0.5,
    fontFace: "Calibri", fontSize: 16, color: "CADCFC",
  });

  // Content slides
  content.slides.forEach((slide, i) => {
    const s = pres.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText(slide.title, {
      x: 0.6, y: 0.5, w: 12, h: 0.9,
      fontFace: "Calibri", fontSize: 30, bold: true, color: ink,
    });
    s.addText(
      slide.bullets.map((b) => ({ text: b, options: { bullet: true } })),
      {
        x: 0.8, y: 1.8, w: 11.5, h: 5,
        fontFace: "Calibri", fontSize: 20, color: ink, valign: "top",
        paraSpaceAfter: 10,
      },
    );
    s.addText(`${i + 2}`, {
      x: 12.4, y: 6.9, w: 0.6, h: 0.3,
      fontFace: "Calibri", fontSize: 10, color: muted, align: "right",
    });
    if (slide.notes) s.addNotes(slide.notes);
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
      .select("id,name,mission,ai_context")
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

    const bytes = await buildPptx(ctx.content as PresentationContent, studentName);
    return {
      base64: toBase64(bytes),
      filename: `${baseName}.pptx`,
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  });