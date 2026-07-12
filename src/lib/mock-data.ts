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

export const missionQuestions: Record<
  MissionType,
  {
    id: string;
    question: string;
    type: "text" | "choice";
    placeholder?: string;
    options?: string[];
  }[]
> = {
  paper: [
    {
      id: "topic",
      question: "Apa judul atau topik makalahnya?",
      type: "text",
      placeholder: "Contoh: Pengaruh motivasi kerja terhadap produktivitas",
    },
    {
      id: "course",
      question: "Mata kuliah apa ini?",
      type: "text",
      placeholder: "Contoh: Manajemen Sumber Daya Manusia",
    },
    {
      id: "level",
      question: "Untuk jenjang apa makalah ini?",
      type: "choice",
      options: ["SMA / SMK", "D3 / Diploma", "S1 / Sarjana", "S2 / Pascasarjana"],
    },
    {
      id: "length",
      question: "Berapa target panjang makalah?",
      type: "choice",
      options: [
        "Pendek (5–8 halaman)",
        "Sedang (10–15 halaman)",
        "Panjang (16–20 halaman)",
      ],
    },
    {
      id: "style",
      question: "Gaya bahasa yang diinginkan?",
      type: "choice",
      options: [
        "Formal skripsi/tesis",
        "Populer & mudah dibaca",
        "Teknis padat data",
      ],
    },
    {
      id: "citation_style",
      question: "Format sitasi & daftar pustaka?",
      type: "choice",
      options: [
        "APA (Nama, Tahun)",
        "IEEE (nomor [1])",
        "Tanpa sitasi formal",
      ],
    },
    {
      id: "depth",
      question: "Seberapa dalam pembahasan yang diinginkan?",
      type: "choice",
      options: [
        "Ringkas — poin-poin utama saja",
        "Sedang — penjelasan + contoh",
        "Mendalam — teori, contoh, & analisis",
      ],
    },
    {
      id: "language",
      question: "Bahasa apa yang dipakai?",
      type: "choice",
      options: ["Bahasa Indonesia", "Bahasa Inggris"],
    },
    {
      id: "notes",
      question:
        "Ada keterangan tambahan? (mis. fokus khusus, batasan, contoh kasus, atau referensi yang harus dipakai). Ketik ‘tidak ada’ jika tidak.",
      type: "text",
      placeholder: "Contoh: fokus pada UMKM di Jawa Barat, hindari data sebelum 2020.",
    },
  ],
  presentation: [
    {
      id: "topic",
      question: "Apa judul atau topik presentasinya?",
      type: "text",
      placeholder: "Contoh: Strategi pemasaran digital UMKM",
    },
    {
      id: "course",
      question: "Untuk mata kuliah apa?",
      type: "text",
      placeholder: "Contoh: Pemasaran Digital",
    },
    {
      id: "slides",
      question: "Berapa jumlah slide yang ideal?",
      type: "choice",
      options: ["Singkat (6–8 slide)", "Standar (10–12 slide)", "Lengkap (15–20 slide)"],
    },
    {
      id: "audience",
      question: "Siapa audiens presentasinya?",
      type: "choice",
      options: [
        "Dosen & teman sekelas",
        "Seminar / sidang akademik",
        "Workshop / pelatihan",
        "Umum / publik",
      ],
    },
    {
      id: "style",
      question: "Gaya bahasa slide?",
      type: "choice",
      options: [
        "Formal skripsi/tesis",
        "Populer & mudah dibaca",
        "Teknis padat data",
      ],
    },
    {
      id: "language",
      question: "Bahasa yang dipakai?",
      type: "choice",
      options: ["Bahasa Indonesia", "Bahasa Inggris"],
    },
    {
      id: "notes",
      question:
        "Ada keterangan tambahan? (mis. fokus khusus, poin wajib, contoh kasus). Ketik ‘tidak ada’ jika tidak.",
      type: "text",
      placeholder: "Contoh: sertakan studi kasus Gojek, tekankan tren 2024.",
    },
  ],
};

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