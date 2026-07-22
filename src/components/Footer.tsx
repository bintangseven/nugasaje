import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-2xl font-black text-on-surface">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Numu AI
            </Link>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-on-surface-variant">
              Platform AI cerdas yang membantu mahasiswa Indonesia meningkatkan kualitas akademik dengan teknologi masa depan.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-on-surface">Produk</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link to="/" hash="misi" className="hover:text-primary">Paper Generator</Link></li>
              <li><Link to="/" hash="misi" className="hover:text-primary">PPT Maker</Link></li>
              <li><Link to="/harga" className="hover:text-primary">Harga</Link></li>
              <li><Link to="/projects" className="hover:text-primary">Proyek saya</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-on-surface">Sumber</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><a href="mailto:halo@numu.ai" className="hover:text-primary">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-on-surface">Legal</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link to="/terms" className="hover:text-primary">Syarat layanan</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Kebijakan privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-outline-variant pt-6 text-xs text-on-surface-variant md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Numu AI. Empowering academic excellence.</span>
          <span className="font-label">v1.0 — Intelligent Academic Ledger</span>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant">
          ⚠️ <strong>Disclaimer:</strong> Konten dihasilkan oleh AI dan bisa
          mengandung kesalahan atau data yang kurang akurat. Selalu periksa
          ulang fakta, sitasi, dan referensi sebelum diserahkan.
        </p>
      </div>
    </footer>
  );
}
