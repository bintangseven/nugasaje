import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--line)", background: "var(--paper-deep)" }}>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-display text-2xl font-bold">
              Nugasin<span style={{ color: "var(--stamp)" }}>aje</span>
            </Link>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
              Ruang kerja akademik untuk mahasiswa Indonesia. Selesaikan makalah dan
              presentasi tanpa drama begadang.
            </p>
          </div>

          <div>
            <span className="eyebrow">Produk</span>
            <ul className="mt-4 space-y-2 text-sm" style={{ color: "var(--ink-soft)" }}>
              <li><Link to="/" hash="misi" className="hover:text-foreground">Misi</Link></li>
              <li><Link to="/" hash="cara" className="hover:text-foreground">Cara memulai</Link></li>
              <li><Link to="/" hash="harga" className="hover:text-foreground">Harga</Link></li>
              <li><Link to="/projects" className="hover:text-foreground">Proyek saya</Link></li>
            </ul>
          </div>

          <div>
            <span className="eyebrow">Sumber</span>
            <ul className="mt-4 space-y-2 text-sm" style={{ color: "var(--ink-soft)" }}>
              <li><Link to="/" hash="cara" className="hover:text-foreground">Panduan</Link></li>
              <li><Link to="/" hash="faq" className="hover:text-foreground">Pertanyaan umum</Link></li>
              <li><a href="mailto:halo@nugasinaje.id" className="hover:text-foreground">Kontak</a></li>
            </ul>
          </div>

          <div>
            <span className="eyebrow">Legal</span>
            <ul className="mt-4 space-y-2 text-sm" style={{ color: "var(--ink-soft)" }}>
              <li><Link to="/terms" className="hover:text-foreground">Syarat layanan</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Kebijakan privasi</Link></li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs md:flex-row md:items-center"
          style={{ borderColor: "var(--line)", color: "var(--graphite)" }}
        >
          <span>© {new Date().getFullYear()} Nugasinaje. Dibuat untuk anak skripsi.</span>
          <span className="font-mono-eyebrow">v1.0 — paper edition</span>
        </div>

        <p
          className="mt-4 text-[11px] leading-relaxed"
          style={{ color: "var(--graphite)" }}
        >
          ⚠️ <strong>Disclaimer:</strong> Konten dihasilkan oleh AI dan bisa
          mengandung kesalahan atau data yang kurang akurat. Selalu periksa
          ulang fakta, sitasi, dan referensi sebelum diserahkan.
        </p>
      </div>
    </footer>
  );
}