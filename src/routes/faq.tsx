import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { useT } from "@/lib/i18n";

const FAQ_KEYS = [1, 2, 3, 4, 5, 6] as const;

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Numu AI" },
      {
        name: "description",
        content:
          "Pertanyaan yang sering ditanya seputar Numu AI: hasil, deteksi AI, keamanan data, upgrade Pro, dan penggunaan untuk skripsi.",
      },
      { property: "og:title", content: "FAQ — Numu AI" },
      {
        property: "og:description",
        content: "Jawaban singkat untuk pertanyaan paling umum tentang Numu AI.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { t } = useT();
  const faqs = FAQ_KEYS.map((n) => ({
    q: t(`faq.q${n}` as "faq.q1"),
    a: t(`faq.a${n}` as "faq.a1"),
  }));
  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-16">
        <Reveal className="mb-10 max-w-2xl">
          <span className="eyebrow">{t("faq.eyebrow")}</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            {t("faq.title")}
          </h1>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-on-surface-variant">
            {t("faq.subtitle")}
          </p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 transition-all hover:border-primary hover:shadow-elegant">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-semibold text-on-surface">
                  <span>{item.q}</span>
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-sm font-bold text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
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