export type MissionType = "paper" | "presentation";
export type ProjectPhase = "interview" | "working" | "done";

export interface ProjectRow {
  id: string;
  name: string;
  mission: MissionType;
  phase: ProjectPhase;
  progress: number;
  step_index: number;
  question_index: number;
  answers: Record<string, string> | null;
  ai_context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const missions = [
  {
    id: "paper",
    title: "Selesaikan Paper",
    description: "Susun makalah lengkap dengan cover, daftar isi, pembahasan, dan referensi.",
    estimate: "± 15 menit",
    icon: "📄",
    output: "Microsoft Word (.docx)",
  },
  {
    id: "presentation",
    title: "Buat Presentasi",
    description: "Hasilkan slide presentasi rapi lengkap dengan catatan pembicara.",
    estimate: "± 10 menit",
    icon: "📊",
    output: "PowerPoint (.pptx)",
  },
] as const;

export function defaultProjectName(mission: MissionType): string {
  return mission === "paper" ? "Paper baru" : "Presentasi baru";
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type MissionQuestion = {
  id: string;
  question: string;
  questionEn: string;
  type: "text" | "choice";
  placeholder?: string;
  placeholderEn?: string;
  options?: string[];
  optionsEn?: string[];
};

export const missionQuestions: Record<MissionType, MissionQuestion[]> = {
  paper: [
    {
      id: "topic",
      question: "Apa judul atau topik makalahnya?",
      questionEn: "What is the title or topic of the paper?",
      type: "text",
      placeholder: "Contoh: Pengaruh motivasi kerja terhadap produktivitas",
      placeholderEn: "Example: The effect of work motivation on productivity",
    },
    {
      id: "course",
      question: "Mata kuliah apa ini?",
      questionEn: "Which course is this for?",
      type: "text",
      placeholder: "Contoh: Manajemen Sumber Daya Manusia",
      placeholderEn: "Example: Human Resource Management",
    },
    {
      id: "level",
      question: "Untuk jenjang apa makalah ini?",
      questionEn: "What academic level is this paper for?",
      type: "choice",
      options: ["SMA / SMK", "D3 / Diploma", "S1 / Sarjana", "S2 / Pascasarjana"],
      optionsEn: ["High school", "Diploma", "Bachelor's", "Master's / Postgraduate"],
    },
    {
      id: "length",
      question: "Berapa target panjang makalah?",
      questionEn: "How long should the paper be?",
      type: "choice",
      options: [
        "Pendek (5\u20138 halaman)",
        "Sedang (10\u201315 halaman)",
        "Panjang (16\u201320 halaman)",
      ],
      optionsEn: [
        "Short (5\u20138 pages)",
        "Medium (10\u201315 pages)",
        "Long (16\u201320 pages)",
      ],
    },
    {
      id: "style",
      question: "Gaya bahasa yang diinginkan?",
      questionEn: "Which writing style do you want?",
      type: "choice",
      options: [
        "Formal skripsi/tesis",
        "Populer & mudah dibaca",
        "Teknis padat data",
      ],
      optionsEn: [
        "Formal thesis style",
        "Popular & easy to read",
        "Technical & data-heavy",
      ],
    },
    {
      id: "citation_style",
      question: "Format sitasi & daftar pustaka?",
      questionEn: "Citation and bibliography format?",
      type: "choice",
      options: [
        "APA (Nama, Tahun)",
        "IEEE (nomor [1])",
        "Tanpa sitasi formal",
      ],
      optionsEn: [
        "APA (Author, Year)",
        "IEEE (numbered [1])",
        "No formal citations",
      ],
    },
    {
      id: "depth",
      question: "Seberapa dalam pembahasan yang diinginkan?",
      questionEn: "How deep should the discussion go?",
      type: "choice",
      options: [
        "Ringkas \u2014 poin-poin utama saja",
        "Sedang \u2014 penjelasan + contoh",
        "Mendalam \u2014 teori, contoh, & analisis",
      ],
      optionsEn: [
        "Concise \u2014 key points only",
        "Medium \u2014 explanation + examples",
        "In-depth \u2014 theory, examples & analysis",
      ],
    },
    {
      id: "language",
      question: "Bahasa apa yang dipakai?",
      questionEn: "Which language should the paper use?",
      type: "choice",
      options: ["Bahasa Indonesia", "Bahasa Inggris"],
      optionsEn: ["Indonesian", "English"],
    },
    {
      id: "notes",
      question:
        "Ada keterangan tambahan? (mis. fokus khusus, batasan, contoh kasus, atau referensi yang harus dipakai). Ketik \u2018tidak ada\u2019 jika tidak.",
      questionEn:
        "Any additional notes? (e.g. special focus, limits, case examples, or required references). Type \u2018none\u2019 if not.",
      type: "text",
      placeholder: "Contoh: fokus pada UMKM di Jawa Barat, hindari data sebelum 2020.",
      placeholderEn: "Example: focus on small businesses in West Java, avoid data before 2020.",
    },
  ],
  presentation: [
    {
      id: "topic",
      question: "Apa judul atau topik presentasinya?",
      questionEn: "What is the title or topic of the presentation?",
      type: "text",
      placeholder: "Contoh: Strategi pemasaran digital UMKM",
      placeholderEn: "Example: Digital marketing strategy for small businesses",
    },
    {
      id: "course",
      question: "Untuk mata kuliah apa?",
      questionEn: "Which course is this for?",
      type: "text",
      placeholder: "Contoh: Pemasaran Digital",
      placeholderEn: "Example: Digital Marketing",
    },
    {
      id: "slides",
      question: "Berapa jumlah slide yang ideal?",
      questionEn: "How many slides do you need?",
      type: "choice",
      options: ["Singkat (6\u20138 slide)", "Standar (10\u201312 slide)", "Lengkap (15\u201320 slide)"],
      optionsEn: ["Short (6\u20138 slides)", "Standard (10\u201312 slides)", "Complete (15\u201320 slides)"],
    },
    {
      id: "audience",
      question: "Siapa audiens presentasinya?",
      questionEn: "Who is the audience?",
      type: "choice",
      options: [
        "Dosen & teman sekelas",
        "Seminar / sidang akademik",
        "Workshop / pelatihan",
        "Umum / publik",
      ],
      optionsEn: [
        "Lecturer & classmates",
        "Seminar / academic defense",
        "Workshop / training",
        "General public",
      ],
    },
    {
      id: "style",
      question: "Gaya bahasa slide?",
      questionEn: "Slide writing style?",
      type: "choice",
      options: [
        "Formal skripsi/tesis",
        "Populer & mudah dibaca",
        "Teknis padat data",
      ],
      optionsEn: [
        "Formal thesis style",
        "Popular & easy to read",
        "Technical & data-heavy",
      ],
    },
    {
      id: "language",
      question: "Bahasa yang dipakai?",
      questionEn: "Which language should the slides use?",
      type: "choice",
      options: ["Bahasa Indonesia", "Bahasa Inggris"],
      optionsEn: ["Indonesian", "English"],
    },
    {
      id: "notes",
      question:
        "Ada keterangan tambahan? (mis. fokus khusus, poin wajib, contoh kasus). Ketik \u2018tidak ada\u2019 jika tidak.",
      questionEn:
        "Any additional notes? (e.g. special focus, required points, case examples). Type \u2018none\u2019 if not.",
      type: "text",
      placeholder: "Contoh: sertakan studi kasus Gojek, tekankan tren 2024.",
      placeholderEn: "Example: include a Gojek case study, highlight 2024 trends.",
    },
  ],
};

/** Localized view of a question; option values stay canonical (Indonesian). */
export function localizeQuestion(q: MissionQuestion, lang: "id" | "en") {
  const en = lang === "en";
  return {
    ...q,
    label: en ? q.questionEn : q.question,
    placeholderLabel: en ? (q.placeholderEn ?? q.placeholder) : q.placeholder,
    optionLabels: en ? (q.optionsEn ?? q.options ?? []) : (q.options ?? []),
  };
}

/** Map a stored (canonical Indonesian) answer to its display label. */
export function localizeAnswer(q: MissionQuestion, value: string, lang: "id" | "en") {
  if (lang !== "en" || !q.options || !q.optionsEn) return value;
  const i = q.options.indexOf(value);
  return i >= 0 ? (q.optionsEn[i] ?? value) : value;
}

export const paperSteps = [
  "Memahami tugas",
  "Menyusun struktur",
  "Menulis pendahuluan",
  "Membangun pembahasan",
  "Menyusun kesimpulan",
  "Menyusun referensi",
  "Memformat dokumen Word",
];

export const presentationSteps = [
  "Memahami topik",
  "Menyusun outline slide",
  "Menulis isi setiap slide",
  "Menulis catatan pembicara",
  "Memilih tata letak visual",
  "Memformat dokumen PowerPoint",
];