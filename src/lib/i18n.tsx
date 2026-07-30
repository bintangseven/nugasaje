import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "id" | "en";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  id: {
    // Header
    "nav.home": "Beranda",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Proyek",
    "nav.pricing": "Harga",
    "nav.faq": "FAQ",
    "nav.profile": "Profil",
    "nav.getStarted": "Mulai Sekarang",
    "menu.dashboard": "Dashboard",
    "menu.myProjects": "Proyek saya",
    "menu.editProfile": "Edit profil",
    "menu.signOut": "Keluar",
    "menu.university": "Universitas",
    "menu.major": "Jurusan",
    "menu.semester": "Semester",
    "menu.notFilled": "Belum diisi",

    // Hero
    "hero.badge": "AI Research Assistant",
    "hero.title1": "Makalah & PPT kelar ",
    "hero.title2": "dalam satu klik.",
    "hero.sub": "Pilih satu misi, jawab beberapa pertanyaan singkat, dan biarkan Numu AI menyusun struktur, isi, sampai daftar pustaka.",
    "hero.cta.start": "Mulai gratis",
    "hero.cta.how": "Lihat caranya",
    "hero.trust.secure": "Data tersimpan aman",
    "hero.trust.fast": "Hasil siap ≤ 3 menit",
    "hero.trust.noCC": "Tanpa kartu kredit",

    // Flow card
    "flow.eyebrow": "Alur proses",
    "flow.live": "LIVE",
    "flow.input": "Input Data",
    "flow.ai": "AI Analysis",
    "flow.output": "Output",
    "flow.headline": "Dari brief singkat ke file siap kumpul",
    "flow.stat.accuracy": "Akurasi",
    "flow.stat.students": "Mahasiswa",
    "flow.stat.rating": "Rating",

    // Missions section
    "missions.eyebrow": "Research tools Terpercaya",
    "missions.title": "Dari topik kosong sampai file siap kumpul",
    "missions.paper": "Paper Research",
    "missions.presentation": "Presentation",
    "missions.citation.title": "Citation Finder",
    "missions.citation.desc": "Cari, validasi, dan format sitasi APA/IEEE otomatis dari jurnal terpercaya pasca-2020.",
    "missions.citation.soon": "Segera hadir",
    "missions.citation.output": "Output: BibTeX / .docx",
    "missions.comingSoon": "Coming soon",

    // How it works
    "how.eyebrow": "Cara memulai",
    "how.title": "Tiga langkah, satu file siap kumpul",
    "how.sub": "Tidak perlu prompt panjang. Cukup jawab pertanyaan singkat, sisanya AI yang kerjakan.",
    "how.step": "Langkah",
    "how.s1.title": "Pilih misi",
    "how.s1.desc": "Tentukan apakah kamu butuh makalah atau presentasi. Satu klik, satu alur.",
    "how.s2.title": "Isi brief singkat",
    "how.s2.desc": "Jawab beberapa pertanyaan: topik, gaya, jumlah bab/slide, dan referensi.",
    "how.s3.title": "Unduh hasilnya",
    "how.s3.desc": "AI menyusun struktur, isi, dan daftar pustaka. Tinggal unduh .docx / .pptx.",

    // Recent
    "recent.eyebrow": "Riwayat",
    "recent.title": "Proyek Terbaru",
    "recent.sub": "Tersinkron otomatis di seluruh perangkatmu.",
    "recent.viewAll": "Lihat semua →",
    "recent.empty": "Belum ada proyek. Mulai misi di atas untuk membuat yang pertama.",

    // CTA
    "cta.eyebrow": "Siap mulai?",
    "cta.title": "Deadline besok?",
    "cta.titleStrong": "Mulai sekarang.",
    "cta.desc": "Pilih satu misi, jawab brief singkat, dan biarkan Numu AI yang lembur. Gratis untuk dicoba — tanpa kartu kredit.",
    "cta.button": "Mulai misi pertama",
    "cta.pro": "Lihat paket Pro →",

    // Footer
    "footer.tagline": "Platform AI cerdas yang membantu mahasiswa dan peneliti di seluruh dunia meningkatkan kualitas akademik dengan teknologi masa depan.",
    "footer.products": "Produk",
    "footer.resources": "Sumber",
    "footer.legal": "Legal",
    "footer.contact": "Kontak",
    "footer.terms": "Syarat layanan",
    "footer.privacy": "Kebijakan privasi",
    "footer.rights": "Empowering academic excellence.",
    "footer.version": "v1.0 — Intelligent Academic Ledger",
    "footer.disclaimer": "Konten dihasilkan oleh AI dan bisa mengandung kesalahan atau data yang kurang akurat. Selalu periksa ulang fakta, sitasi, dan referensi sebelum diserahkan.",
    "footer.disclaimerLabel": "Disclaimer:",

    // Language switcher
    "lang.label": "Bahasa",

    // Mission workspace
    "mission.back": "Kembali ke proyek",
    "mission.timeLeft": "Sisa waktu",
    "mission.done": "Selesai",
    "mission.downloadDocx": "Unduh .docx",
    "mission.docPreview": "Dokumen Word",
    "mission.slidePreview": "Slide PowerPoint",
    "mission.preview": "Preview",
    "mission.assistant": "Asisten Numu",
    "mission.aiActivity": "Aktivitas AI",
    "mission.saving": "Menyimpan…",
    "mission.saved": "Tersimpan",
    "mission.syncFail": "Gagal menyimpan",
    "mission.sync": "Sinkron",
    "mission.readyToStart": "Aku punya semua yang aku butuhkan. Klik Mulai kerjakan dan aku akan menyusun karyamu.",
    "mission.working": "Sedang aku kerjakan. Kamu bisa rebahan sebentar 🌿",
    "mission.finished": "Selesai! File siap diunduh dan diedit.",
    "mission.questionOf": "Pertanyaan",
    "mission.of": "dari",
    "mission.next": "Lanjut",
    "mission.attachOptional": "Lampiran (opsional)",
    "mission.attachHint": "Unggah materi referensi (PDF, TXT, MD, atau gambar, maks 10MB). AI akan menjadikannya bahan utama.",
    "mission.pickFile": "Pilih file",
    "mission.removeAttach": "Hapus lampiran",
    "mission.workingHint": "Sedang dikerjakan AI… kamu bebas menutup halaman ini.",
    "mission.rerun": "Jalankan ulang jika macet",
    "mission.start": "Mulai kerjakan",
    "mission.emptyPreview": "Preview akan muncul di sini saat aku mulai menyusun.",
    "mission.loading": "Memuat proyek…",
    "mission.notFound": "Proyek tidak ditemukan",

    // Assistant tips
    "tips.title": "Tips dari Asisten Numu",
    "tips.from": "Asisten Numu",
    "tips.for": "Tips untuk proyek ini",
    "tips.close": "Tutup tips",
    "tips.next": "Tips lain",
    "tips.gotIt": "Mengerti",
    "tips.paper.1": "Topik yang spesifik menghasilkan paper lebih fokus. Hindari topik yang terlalu luas.",
    "tips.paper.2": "Gunakan lampiran PDF/TXT untuk memberikan materi dasar agar AI menyesuaikan gaya bahasamu.",
    "tips.paper.3": "Tambahkan keterangan di kolom Catatan untuk arahan khusus, misalnya gaya bahasa atau sumber yang diinginkan.",
    "tips.paper.4": "Sitasi otomatis sudah disetel pasca-2020. Selalu periksa ulang referensi sebelum pengumpulan.",
    "tips.presentation.1": "Slide paling efektif menggabungkan narasi paragraf 50% + bullet 50%. Jangan hanya poin-poin kering.",
    "tips.presentation.2": "Jelaskan target audiens di kolom Catatan agar AI menyesuaikan kedalaman materi.",
    "tips.presentation.3": "AI akan mencari gambar Unsplash berbahasa Inggris. Deskripsikan visual yang diinginkan secara spesifik.",
    "tips.presentation.4": "Jumlah slide ideal 8–15. Terlalu sedikit kurang informatif, terlalu banyak membosankan audiens.",
  en: {
    // Header
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.pricing": "Pricing",
    "nav.faq": "FAQ",
    "nav.profile": "Profile",
    "nav.getStarted": "Get Started",
    "menu.dashboard": "Dashboard",
    "menu.myProjects": "My projects",
    "menu.editProfile": "Edit profile",
    "menu.signOut": "Sign out",
    "menu.university": "University",
    "menu.major": "Major",
    "menu.semester": "Semester",
    "menu.notFilled": "Not set",

    // Hero
    "hero.badge": "AI Research Assistant",
    "hero.title1": "Papers & slides done ",
    "hero.title2": "in one click.",
    "hero.sub": "Pick a mission, answer a few quick questions, and let Numu AI craft the structure, content, and references for you.",
    "hero.cta.start": "Start free",
    "hero.cta.how": "See how",
    "hero.trust.secure": "Your data stays safe",
    "hero.trust.fast": "Ready in ≤ 3 minutes",
    "hero.trust.noCC": "No credit card required",

    // Flow card
    "flow.eyebrow": "Process flow",
    "flow.live": "LIVE",
    "flow.input": "Input Data",
    "flow.ai": "AI Analysis",
    "flow.output": "Output",
    "flow.headline": "From a short brief to a ready-to-submit file",
    "flow.stat.accuracy": "Accuracy",
    "flow.stat.students": "Students",
    "flow.stat.rating": "Rating",

    // Missions
    "missions.eyebrow": "Trusted research tools",
    "missions.title": "From a blank topic to a ready-to-submit file",
    "missions.paper": "Paper Research",
    "missions.presentation": "Presentation",
    "missions.citation.title": "Citation Finder",
    "missions.citation.desc": "Find, verify, and format APA/IEEE citations automatically from trusted post-2020 journals.",
    "missions.citation.soon": "Coming soon",
    "missions.citation.output": "Output: BibTeX / .docx",
    "missions.comingSoon": "Coming soon",

    // How it works
    "how.eyebrow": "How to start",
    "how.title": "Three steps, one ready-to-submit file",
    "how.sub": "No long prompts needed. Just answer a few questions and let the AI handle the rest.",
    "how.step": "Step",
    "how.s1.title": "Pick a mission",
    "how.s1.desc": "Decide whether you need a paper or a presentation. One click, one flow.",
    "how.s2.title": "Fill a short brief",
    "how.s2.desc": "Answer a few questions: topic, tone, number of chapters/slides, and references.",
    "how.s3.title": "Download the result",
    "how.s3.desc": "The AI drafts the structure, content, and references. Just download .docx / .pptx.",

    // Recent
    "recent.eyebrow": "History",
    "recent.title": "Recent Projects",
    "recent.sub": "Synced automatically across your devices.",
    "recent.viewAll": "View all →",
    "recent.empty": "No projects yet. Start a mission above to create your first one.",

    // CTA
    "cta.eyebrow": "Ready to start?",
    "cta.title": "Deadline tomorrow?",
    "cta.titleStrong": "Start now.",
    "cta.desc": "Pick a mission, fill in a short brief, and let Numu AI pull the all-nighter. Free to try — no credit card needed.",
    "cta.button": "Start your first mission",
    "cta.pro": "See Pro plans →",

    // Footer
    "footer.tagline": "A smart AI platform helping students and researchers worldwide raise their academic quality with future-ready technology.",
    "footer.products": "Products",
    "footer.resources": "Resources",
    "footer.legal": "Legal",
    "footer.contact": "Contact",
    "footer.terms": "Terms of service",
    "footer.privacy": "Privacy policy",
    "footer.rights": "Empowering academic excellence.",
    "footer.version": "v1.0 — Intelligent Academic Ledger",
    "footer.disclaimer": "Content is generated by AI and may contain errors or inaccurate data. Always double-check facts, citations, and references before submitting.",
    "footer.disclaimerLabel": "Disclaimer:",

    // Language switcher
    "lang.label": "Language",

    // Mission workspace
    "mission.back": "Back to projects",
    "mission.timeLeft": "Time left",
    "mission.done": "Done",
    "mission.downloadDocx": "Download .docx",
    "mission.docPreview": "Word document",
    "mission.slidePreview": "PowerPoint slides",
    "mission.preview": "Preview",
    "mission.assistant": "Numu Assistant",
    "mission.aiActivity": "AI activity",
    "mission.saving": "Saving…",
    "mission.saved": "Saved",
    "mission.syncFail": "Failed to save",
    "mission.sync": "Synced",
    "mission.readyToStart": "I have everything I need. Click Start and I'll put your work together.",
    "mission.working": "Working on it. Feel free to relax 🌿",
    "mission.finished": "Done! Your file is ready to download and edit.",
    "mission.questionOf": "Question",
    "mission.of": "of",
    "mission.next": "Next",
    "mission.attachOptional": "Attachment (optional)",
    "mission.attachHint": "Upload reference material (PDF, TXT, MD, or image, up to 10MB). The AI will use it as the main source.",
    "mission.pickFile": "Pick a file",
    "mission.removeAttach": "Remove attachment",
    "mission.workingHint": "AI is working… you can safely close this page.",
    "mission.rerun": "Re-run if stuck",
    "mission.start": "Start",
    "mission.emptyPreview": "The preview will appear here once I start drafting.",
    "mission.loading": "Loading project…",
    "mission.notFound": "Project not found",

    // Assistant tips
    "tips.title": "Tips from Numu Assistant",
    "tips.from": "Numu Assistant",
    "tips.for": "Tips for this project",
    "tips.close": "Close tips",
    "tips.next": "More tips",
    "tips.gotIt": "Got it",
    "tips.paper.1": "A specific topic produces a more focused paper. Avoid overly broad topics.",
    "tips.paper.2": "Upload PDF/TXT attachments to give the AI source material so it matches your writing style.",
    "tips.paper.3": "Use the Additional Notes field for special directions, such as tone or preferred sources.",
    "tips.paper.4": "Automatic citations are set to post-2020 sources. Always double-check references before submitting.",
    "tips.presentation.1": "The best slides mix 50% narrative paragraphs and 50% bullet points. Avoid dry lists only.",
    "tips.presentation.2": "Describe your target audience in the Notes field so the AI adjusts the depth of the material.",
    "tips.presentation.3": "The AI will search Unsplash using English queries. Describe the desired visuals specifically.",
    "tips.presentation.4": "The ideal slide count is 8–15. Too few slides lack information; too many bore the audience.",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: keyof typeof translations["id"]) => string };
const LangContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "numu.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "id" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {}
  }, []);

  useEffect(() => {
    try { document.documentElement.lang = lang; } catch {}
  }, [lang]);

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (key) => translations[lang][key] ?? translations.id[key] ?? String(key),
  }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Fallback: return identity function when provider is missing (e.g. SSR safety)
    return {
      lang: "id" as Lang,
      setLang: (_: Lang) => {},
      t: (key: string) => translations.id[key] ?? key,
    };
  }
  return ctx;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  const isID = lang === "id";
  return (
    <button
      type="button"
      onClick={() => setLang(isID ? "en" : "id")}
      className={`inline-flex items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-lowest text-[11px] font-bold tracking-wider ${className}`}
      aria-label={`Switch language, current ${lang.toUpperCase()}`}
      title="ID / EN"
    >
      <span
        className={`px-2.5 py-1 transition-colors ${isID ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}
      >
        ID
      </span>
      <span
        className={`px-2.5 py-1 transition-colors ${!isID ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}
      >
        EN
      </span>
    </button>
  );
}