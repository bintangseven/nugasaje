export type MissionType = "paper" | "presentation";

export interface Project {
  id: string;
  name: string;
  mission: MissionType;
  progress: number; // 0-100
  updatedAt: string; // human readable
  course?: string;
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

export const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Paper - Manajemen Sumber Daya Manusia",
    mission: "paper",
    progress: 65,
    updatedAt: "2 jam lalu",
    course: "Manajemen SDM",
  },
  {
    id: "p2",
    name: "Presentasi - Strategi Pemasaran Digital",
    mission: "presentation",
    progress: 100,
    updatedAt: "Kemarin",
    course: "Pemasaran Digital",
  },
  {
    id: "p3",
    name: "Paper - Etika Bisnis di Era Digital",
    mission: "paper",
    progress: 30,
    updatedAt: "3 hari lalu",
    course: "Etika Bisnis",
  },
  {
    id: "p4",
    name: "Presentasi - Analisis Laporan Keuangan",
    mission: "presentation",
    progress: 100,
    updatedAt: "Minggu lalu",
    course: "Akuntansi Keuangan",
  },
];

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