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
  { id: string; question: string; placeholder: string }[]
> = {
  paper: [
    {
      id: "topic",
      question: "Apa topik paper yang ingin kamu kerjakan?",
      placeholder: "Contoh: Pengaruh motivasi kerja terhadap produktivitas",
    },
    {
      id: "course",
      question: "Mata kuliah apa ini?",
      placeholder: "Contoh: Manajemen Sumber Daya Manusia",
    },
    {
      id: "length",
      question: "Berapa target panjang paper?",
      placeholder: "Contoh: 10 halaman, sekitar 2500 kata",
    },
    {
      id: "style",
      question: "Gaya penulisan seperti apa yang kamu inginkan?",
      placeholder: "Contoh: Formal akademik dengan sitasi APA",
    },
    {
      id: "language",
      question: "Bahasa apa yang dipakai?",
      placeholder: "Contoh: Bahasa Indonesia",
    },
  ],
  presentation: [
    {
      id: "topic",
      question: "Apa topik presentasinya?",
      placeholder: "Contoh: Strategi pemasaran digital UMKM",
    },
    {
      id: "course",
      question: "Untuk mata kuliah apa?",
      placeholder: "Contoh: Pemasaran Digital",
    },
    {
      id: "slides",
      question: "Berapa jumlah slide yang ideal?",
      placeholder: "Contoh: 12 slide",
    },
    {
      id: "audience",
      question: "Siapa audiens presentasinya?",
      placeholder: "Contoh: Dosen dan teman sekelas",
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