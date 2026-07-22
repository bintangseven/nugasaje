import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi — Numu AI" },
      {
        name: "description",
        content:
          "Pelajari bagaimana Numu AI mengumpulkan, memakai, dan melindungi data pribadi serta proyek akademikmu.",
      },
      { property: "og:title", content: "Kebijakan Privasi — Numu AI" },
      {
        property: "og:description",
        content:
          "Detail lengkap kebijakan privasi Numu AI: data yang dikumpulkan, penggunaan, retensi, dan hak pengguna.",
      },
      { property: "og:url", content: "https://nugasaje.lovable.app/privacy" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://nugasaje.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 pt-16 pb-12">
        <span className="eyebrow">Legal</span>
        <h1 className="mt-3 font-display text-4xl font-semibold">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--graphite)" }}>
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="mt-10 space-y-8 text-[0.98rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Data yang Kami Kumpulkan</h2>
            <p className="mt-2">
              Kami menyimpan: data akun (nama, email, info kampus opsional), brief dan
              jawaban yang kamu masukkan, hasil yang dihasilkan AI, serta metadata
              teknis dasar (waktu akses, jenis perangkat) untuk keperluan keamanan.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Penggunaan Data</h2>
            <p className="mt-2">
              Data dipakai untuk: menjalankan Layanan, menyimpan riwayat proyek,
              menampilkan ekspor ulang, menegakkan kuota, mendukung pengguna, dan
              memperbaiki kualitas Layanan.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Penyedia Pihak Ketiga</h2>
            <p className="mt-2">
              Layanan menggunakan penyedia infrastruktur dan AI (al. Lovable Cloud
              untuk database & auth, dan AI Gateway untuk generasi konten). Data
              dikirim hanya sebatas yang diperlukan untuk memenuhi permintaanmu.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Penyimpanan & Retensi</h2>
            <p className="mt-2">
              Data disimpan selama akunmu aktif. Kamu dapat menghapus proyek kapan
              saja dari halaman Proyek. Penghapusan akun akan menghapus seluruh
              data terkait dalam waktu wajar.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Keamanan</h2>
            <p className="mt-2">
              Akses ke data dilindungi oleh otorisasi per-pengguna (Row Level
              Security) dan koneksi terenkripsi. Hanya akunmu sendiri yang dapat
              melihat brief dan hasilmu.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Hak Kamu</h2>
            <p className="mt-2">
              Kamu berhak mengakses, memperbaiki, dan menghapus datamu, serta
              menarik persetujuan kapan saja dengan menghapus akun atau
              menghubungi kami.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Cookie</h2>
            <p className="mt-2">
              Kami memakai cookie esensial untuk menjaga sesi login. Tidak ada
              cookie pelacakan iklan pihak ketiga.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. Anak di Bawah Umur</h2>
            <p className="mt-2">
              Layanan ditujukan untuk pengguna berusia 17 tahun ke atas atau
              mahasiswa terdaftar.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">9. Kontak</h2>
            <p className="mt-2">
              Pertanyaan privasi:{" "}
              <a className="underline" href="mailto:halo@numu-ai.id">halo@numu-ai.id</a>.
            </p>
          </section>

          <p className="pt-4 text-sm">
            Lihat juga <Link to="/terms" className="font-semibold text-foreground underline">Syarat Layanan</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}