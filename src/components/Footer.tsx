import { Link } from "@tanstack/react-router";
import numuLogoFooter from "@/assets/numu-logo-footer.svg.asset.json";
import { useT } from "@/lib/i18n";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-24 border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" aria-label="Numu AI" className="flex items-center">
              <img src={numuLogoFooter.url} alt="Numu AI" className="h-10 w-auto" />
            </Link>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-on-surface-variant">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-on-surface">{t("footer.products")}</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link to="/" hash="misi" className="hover:text-primary">Paper Research Assistant</Link></li>
              <li><Link to="/" hash="misi" className="hover:text-primary">Presentation Maker</Link></li>
              <li><Link to="/" hash="misi" className="hover:text-primary">Citation Finder ({t("missions.comingSoon")})</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-on-surface">{t("footer.resources")}</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link to="/faq" className="hover:text-primary">{t("nav.faq")}</Link></li>
              <li><a href="mailto:halo@numu.ai" className="hover:text-primary">{t("footer.contact")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold text-on-surface">{t("footer.legal")}</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link to="/terms" className="hover:text-primary">{t("footer.terms")}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">{t("footer.privacy")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-outline-variant pt-6 text-xs text-on-surface-variant md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Numu AI. {t("footer.rights")}</span>
          <span className="font-label">{t("footer.version")}</span>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant">
          ⚠️ <strong>{t("footer.disclaimerLabel")}</strong> {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
