import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Syarat Layanan — Nugasinaje" },
      {
        name: "description",
        content:
          "Baca syarat dan ketentuan penggunaan layanan Nugasinaje untuk memahami hak dan kewajibanmu sebagai pengguna.",
      },
      { property: "og:title", content: "Syarat Layanan — Nugasinaje" },
      {
        property: "og:description",
        content:
          "Ketentuan penggunaan Nugasinaje: hak, kewajiban, dan tanggung jawab pengguna platform.",
      },
      { property: "og:url", content: "https://nugasaje.lovable.app/terms" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://nugasaje.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 pt-16 pb-12">
        <span className="eyebrow">Legal</span>
        <h1 className="mt-3 font-display text-4xl font-semibold">Syarat Layanan</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--graphite)" }}>
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose-content mt-10 space-y-8 text-[0.98rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">1. Penerimaan</h2>
            <p className="mt-2">
              Dengan membuat akun atau menggunakan Nugasinaje (“Layanan”), kamu setuju
              dengan syarat layanan ini. Bila tidak setuju, mohon tidak menggunakan Layanan.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">2. Penggunaan yang Diizinkan</h2>
            <p className="mt-2">
              Layanan ditujukan sebagai asisten belajar untuk membantu menyusun
              kerangka, draft, dan slide. Kamu bertanggung jawab untuk memverifikasi
              isi, menambahkan referensi pribadi, dan memastikan hasil sesuai dengan
              aturan akademik kampusmu.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">3. Akun dan Kuota</h2>
            <p className="mt-2">
              Paket Basic gratis dengan batas 2 submission per hari. Paket Pro
              memberikan 10 submission per hari. Penyalahgunaan (akun ganda,
              automasi, distribusi ulang) dapat menyebabkan penangguhan akun.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">4. Hak Konten</h2>
            <p className="mt-2">
              Konten yang kamu input dan hasil yang dihasilkan adalah milikmu.
              Kami menyimpan salinan untuk keperluan operasional (riwayat, ekspor
              ulang, dukungan).
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">5. Larangan</h2>
            <p className="mt-2">
              Dilarang menggunakan Layanan untuk konten ilegal, melanggar hak cipta,
              ujaran kebencian, atau aktivitas yang merugikan pihak ketiga.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">6. Pembayaran</h2>
            <p className="mt-2">
              Paket Pro dibayarkan di muka per bulan. Promo dapat berubah sewaktu-waktu.
              Pembatalan akan berlaku pada periode penagihan berikutnya.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">7. Penafian</h2>
            <p className="mt-2">
              Layanan disediakan apa adanya. Kami tidak menjamin bebas dari kesalahan
              faktual dan tidak bertanggung jawab atas nilai akademik atau keputusan
              yang diambil berdasarkan hasil Layanan.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">8. Perubahan</h2>
            <p className="mt-2">
              Syarat ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan
              diinformasikan melalui email atau di dalam aplikasi.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">9. Kontak</h2>
            <p className="mt-2">
              Pertanyaan terkait syarat layanan dapat dikirim ke{" "}
              <a className="underline" href="mailto:halo@nugasinaje.id">halo@nugasinaje.id</a>.
            </p>
          </section>

          <p className="pt-4 text-sm">
            Lihat juga <Link to="/privacy" className="font-semibold text-foreground underline">Kebijakan Privasi</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}