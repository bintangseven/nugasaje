import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/nugasinaje-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--line)", background: "var(--paper-deep)" }}>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center" aria-label="Nugasinaje">
              <img src={logoAsset.url} alt="Nugasinaje" className="h-10 w-auto" />
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
      </div>
    </footer>
  );
}