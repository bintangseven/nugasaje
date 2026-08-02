import { useState } from "react";
import { FileText, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { buildPptx, type SlideInput } from "@/lib/slide-renderer";
import { useT } from "@/lib/i18n";

// ============================================================================
// CONTOH HASIL NYATA
// File .docx & .pptx contoh dibuat di browser memakai pipeline render yang
// sama dengan hasil asli, sehingga calon pengguna melihat kerapian format.
// ============================================================================

const SAMPLE_TITLE = "Transformasi Digital UMKM di Indonesia";
const SAMPLE_COURSE = "Manajemen Strategi";

async function downloadSampleDocx() {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak, HeadingLevel } = await import("docx");
  const FONT = "Times New Roman";
  const BODY = 24;

  const body = (text: string, opts: { italic?: boolean; firstLine?: boolean } = {}) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: 360 },
      indent: opts.firstLine ? { firstLine: 720 } : undefined,
      children: [new TextRun({ text, font: FONT, size: BODY, italics: opts.italic })],
    });

  const center = (text: string, size: number, bold = false, after = 200) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after },
      children: [new TextRun({ text, font: FONT, size, bold })],
    });

  const h1 = (text: string, pageBreakBefore = true) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      pageBreakBefore,
      children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 28, bold: true })],
    });

  const doc = new Document({
    creator: "Numu AI",
    title: SAMPLE_TITLE,
    styles: { default: { document: { run: { font: FONT, size: BODY } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1701, right: 1701, bottom: 1701, left: 2268 },
          },
        },
        children: [
          center(SAMPLE_TITLE.toUpperCase(), 32, true, 400),
          center("MAKALAH", BODY, true),
          center(`Mata Kuliah: ${SAMPLE_COURSE}`, BODY, false, 1200),
          center("Contoh hasil dari Numu AI", BODY, false, 1200),
          center(new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }), BODY),
          new Paragraph({ children: [new PageBreak()] }),
          h1("Abstrak", false),
          body(
            "Makalah contoh ini memperlihatkan format keluaran Numu AI: sampul, penomoran, margin standar (kiri 4 cm), spasi 1,5, teks rata kanan-kiri, serta daftar pustaka bergaya APA. Isi di bawah hanya cuplikan singkat.",
            { italic: true, firstLine: true },
          ),
          h1("BAB I Pendahuluan"),
          body(
            "Transformasi digital menjadi penentu daya saing UMKM Indonesia. Adopsi kanal digital mempercepat jangkauan pasar sekaligus menuntut kesiapan literasi teknologi pelaku usaha.",
            { firstLine: true },
          ),
          body(
            "Makalah ini membahas faktor pendorong, hambatan, dan strategi adopsi teknologi digital pada UMKM dengan menggunakan sumber terbaru pasca-2020.",
            { firstLine: true },
          ),
          h1("BAB II Pembahasan"),
          body(
            "Hasil telaah menunjukkan tiga faktor utama: kesiapan sumber daya manusia, akses pembiayaan, dan dukungan ekosistem platform. Ketiganya saling menguatkan ketika didampingi pelatihan berkelanjutan.",
            { firstLine: true },
          ),
          h1("Kesimpulan"),
          body(
            "Transformasi digital UMKM berjalan optimal bila intervensi kebijakan, pendampingan teknis, dan akses pasar digital dijalankan bersamaan.",
            { firstLine: true },
          ),
          h1("Daftar Pustaka"),
          new Paragraph({
            spacing: { after: 120, line: 360 },
            indent: { left: 720, hanging: 720 },
            children: [
              new TextRun({
                text: "Contoh entri: Nugroho, A. (2023). Digitalisasi UMKM di Indonesia. Jurnal Ekonomi Digital, 5(2), 112–128.",
                font: FONT,
                size: BODY,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Contoh-Makalah-Numu-AI.docx";
  a.click();
  URL.revokeObjectURL(url);
}

const SAMPLE_SLIDES: SlideInput[] = [
  {
    structured: {
      layout: "cover",
      kicker: "Contoh Hasil Numu AI",
      title: SAMPLE_TITLE,
      subtitle: `${SAMPLE_COURSE} · Presentasi otomatis`,
      footer: "numu.ai",
    },
  },
  {
    structured: {
      layout: "agenda",
      title: "Agenda",
      bullets: ["Latar belakang", "Kondisi UMKM digital", "Hambatan adopsi", "Strategi & rekomendasi"],
    },
  },
  {
    structured: {
      layout: "content",
      kicker: "Latar Belakang",
      title: "Mengapa digitalisasi mendesak?",
      paragraphs: [
        "Perubahan perilaku konsumen mendorong UMKM untuk hadir di kanal digital agar tetap relevan dan kompetitif.",
      ],
      bullets: ["Jangkauan pasar lebih luas", "Efisiensi biaya operasional", "Data pelanggan lebih terukur"],
    },
  },
  {
    structured: {
      layout: "stats",
      kicker: "Data Kunci",
      title: "Gambaran singkat",
      stats: [
        { value: "64jt", label: "UMKM di Indonesia" },
        { value: "±30%", label: "Sudah on-boarding digital" },
        { value: "2x", label: "Pertumbuhan omzet rata-rata" },
      ],
    },
  },
  {
    structured: {
      layout: "two_column",
      kicker: "Analisis",
      title: "Hambatan vs Solusi",
      columns: [
        { heading: "Hambatan", items: ["Literasi digital rendah", "Akses modal terbatas", "Logistik belum merata"] },
        { heading: "Solusi", items: ["Pelatihan berkelanjutan", "Skema pembiayaan mikro", "Kemitraan platform"] },
      ],
    },
  },
  {
    structured: {
      layout: "closing",
      title: "Terima kasih",
      subtitle: "Dibuat otomatis oleh Numu AI — siap diedit di PowerPoint.",
      footer: "numu.ai",
    },
  },
];

export function SampleDownloads() {
  const { t } = useT();
  const [busy, setBusy] = useState<"docx" | "pptx" | null>(null);

  async function run(kind: "docx" | "pptx") {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === "docx") await downloadSampleDocx();
      else
        await buildPptx(
          SAMPLE_SLIDES,
          { title: SAMPLE_TITLE, subtitle: SAMPLE_COURSE },
          "Contoh-Presentasi-Numu-AI.pptx",
        );
    } catch (err) {
      console.error("[sample-download]", err);
      toast.error(err instanceof Error ? err.message : "Gagal membuat contoh file");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[52ch]">
          <span className="eyebrow">{t("sample.eyebrow")}</span>
          <h3 className="mt-3 font-display text-2xl font-semibold text-on-surface">{t("sample.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t("sample.sub")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => run("docx")}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {busy === "docx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t("sample.docx")}
          </button>
          <button
            type="button"
            onClick={() => run("pptx")}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {busy === "pptx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4" />}
            {t("sample.pptx")}
          </button>
        </div>
      </div>
    </div>
  );
}
