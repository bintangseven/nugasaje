import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PaperContent = {
  title: string;
  course: string;
  abstract: string;
  sections: { heading: string; paragraphs: string[] }[];
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

  const cover = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 400 },
      children: [new TextRun({ text: content.title, bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: content.course, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1600, after: 200 },
      children: [new TextRun({ text: studentName, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), size: 22 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const abstractBlock = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 200 },
      children: [new TextRun({ text: "Abstrak", bold: true, size: 28 })],
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [new TextRun({ text: content.abstract, size: 24 })],
    }),
  ];

  const sectionBlocks = content.sections.flatMap((s) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 200 },
      children: [new TextRun({ text: s.heading, bold: true, size: 28 })],
    }),
    ...s.paragraphs.map(
      (p) =>
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: p, size: 24 })],
        }),
    ),
  ]);

  const conclusion = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 200 },
      children: [new TextRun({ text: "Kesimpulan", bold: true, size: 28 })],
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [new TextRun({ text: content.conclusion, size: 24 })],
    }),
  ];

  const references = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 200 },
      children: [new TextRun({ text: "Daftar Pustaka", bold: true, size: 28 })],
    }),
    ...content.references.map(
      (r) =>
        new Paragraph({
          spacing: { after: 120, line: 320 },
          indent: { left: 0, hanging: 360 },
          children: [new TextRun({ text: r, size: 22 })],
        }),
    ),
  ];

  const doc = new Document({
    creator: "Student OS",
    title: content.title,
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
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