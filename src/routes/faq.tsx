import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";

const FAQS = [
  {
    q: "Apakah hasilnya bisa diedit?",
    a: "Bisa. File .docx bisa dibuka di Word/Google Docs, dan .pptx bisa diedit di PowerPoint, Keynote, atau Canva. Semua isi bebas kamu ubah.",
  },
  {
    q: "Apakah hasilnya akan terdeteksi AI?",
    a: "Kami menyusun struktur dan kalimat ala mahasiswa, bukan hasil mentah model. Tapi tetap baca ulang, tambahkan referensi pribadi, dan sesuaikan gaya kamu sendiri sebelum dikumpulkan.",
  },
  {
    q: "Bagaimana kalau hasilnya kurang sesuai?",
    a: "Kamu bisa ulangi dengan brief yang lebih spesifik (tambah outline, gaya bahasa, atau lampirkan PDF referensi). Tiap submission gratis di paket Basic dan murah di Pro.",
  },
  {
    q: "Apakah datanya aman?",
    a: "Brief, jawaban, dan hasilmu hanya bisa diakses oleh akunmu sendiri. Lihat halaman kebijakan privasi untuk detail penyimpanan dan retensi.",
  },
  {
    q: "Bagaimana cara upgrade ke Pro?",
    a: "Masuk ke menu Profil dan tekan Upgrade. Selama masa promo, paket Pro hanya Rp50.000/bulan dengan 10 submission/hari.",
  },
  {
    q: "Bisa dipakai untuk skripsi/jurnal?",
    a: "Bisa untuk bab pendukung, ringkasan, dan kerangka. Untuk karya akhir, gunakan sebagai asisten — referensi dan analisis utama tetap perlu kamu validasi.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Nugasinaje" },
      {
        name: "description",
        content:
          "Pertanyaan yang sering ditanya seputar Nugasinaje: hasil, deteksi AI, keamanan data, upgrade Pro, dan penggunaan untuk skripsi.",
      },
      { property: "og:title", content: "FAQ — Nugasinaje" },
      {
        property: "og:description",
        content: "Jawaban singkat untuk pertanyaan paling umum tentang Nugasinaje.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-14">
        <Reveal className="mb-10 max-w-2xl">
          <span className="eyebrow">FAQ</span>
          <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Pertanyaan yang sering ditanya
          </h1>
          <p className="mt-3 text-[1rem]" style={{ color: "var(--graphite)" }}>
            Belum ketemu jawabannya? Kirim pesan lewat menu Profil.
          </p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="group rounded-[10px] border border-border bg-card p-5 transition-all hover:shadow-elegant">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-semibold">
                  <span>{item.q}</span>
                  <span
                    className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm transition-transform group-open:rotate-45"
                    style={{ borderColor: "var(--line)", color: "var(--graphite)" }}
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}