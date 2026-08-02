import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useT } from "@/lib/i18n";

// ============================================================================
// MINI DEMO INTERAKTIF
// Menghasilkan draf outline instan (template deterministik, tanpa biaya AI)
// agar pengunjung bisa merasakan hasil sebelum diminta sign-up.
// ============================================================================

type Outline = { heading: string; points: string[] }[];

function buildOutline(topic: string, lang: "id" | "en"): Outline {
  const T = topic.trim().replace(/\s+/g, " ");
  if (lang === "en") {
    return [
      {
        heading: "I. Introduction",
        points: [
          `Background: why "${T}" matters today`,
          "Problem statement and research questions",
          "Objectives and scope of the paper",
        ],
      },
      {
        heading: "II. Literature Review",
        points: [
          `Key theories underpinning ${T}`,
          "Recent findings (post-2020 sources)",
          "Research gap this paper addresses",
        ],
      },
      {
        heading: "III. Discussion",
        points: [
          `Analysis of ${T} using the chosen framework`,
          "Case example and supporting data",
          "Implications and limitations",
        ],
      },
      {
        heading: "IV. Conclusion",
        points: ["Summary of findings", "Practical recommendations", "Suggestions for further research"],
      },
    ];
  }
  return [
    {
      heading: "BAB I — Pendahuluan",
      points: [
        `Latar belakang: urgensi ${T} saat ini`,
        "Rumusan masalah dan pertanyaan penelitian",
        "Tujuan dan batasan penulisan",
      ],
    },
    {
      heading: "BAB II — Tinjauan Pustaka",
      points: [
        `Teori utama yang melandasi ${T}`,
        "Temuan penelitian terbaru (sumber pasca-2020)",
        "Celah penelitian yang diisi makalah ini",
      ],
    },
    {
      heading: "BAB III — Pembahasan",
      points: [
        `Analisis ${T} dengan kerangka yang dipilih`,
        "Contoh kasus dan data pendukung",
        "Implikasi serta keterbatasan",
      ],
    },
    {
      heading: "BAB IV — Penutup",
      points: ["Kesimpulan temuan", "Rekomendasi praktis", "Saran untuk penelitian lanjutan"],
    },
  ];
}

export function MiniDemo() {
  const { t, lang } = useT();
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [usedTopic, setUsedTopic] = useState("");

  const examples =
    lang === "en"
      ? ["Digital marketing for MSMEs", "Impact of AI on education", "Circular economy in Indonesia"]
      : ["Pemasaran digital UMKM", "Dampak AI terhadap pendidikan", "Ekonomi sirkular di Indonesia"];

  function run(value: string) {
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true);
    setOutline(null);
    window.setTimeout(() => {
      setUsedTopic(v);
      setOutline(buildOutline(v, lang));
      setBusy(false);
    }, 650);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
      <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-outline-variant p-7 md:border-b-0 md:border-r">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("demo.badge")}
          </span>
          <h3 className="mt-4 font-display text-2xl font-semibold text-on-surface">{t("demo.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t("demo.sub")}</p>

          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(topic);
            }}
          >
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("demo.placeholder")}
              maxLength={90}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/70 focus:border-primary"
            />
            <button
              type="submit"
              disabled={!topic.trim() || busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {t("demo.button")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setTopic(ex);
                  run(ex);
                }}
                className="rounded-full border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low p-7">
          {!outline && !busy && (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
              <Wand2 className="h-8 w-8 text-primary/60" />
              <p className="mt-3 max-w-[30ch] text-sm text-on-surface-variant">{t("demo.empty")}</p>
            </div>
          )}
          {busy && (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-on-surface-variant">{t("demo.loading")}</p>
            </div>
          )}
          {outline && !busy && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {t("demo.resultFor")}
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-on-surface">{usedTopic}</p>
              <ol className="mt-4 space-y-3">
                {outline.map((s, i) => (
                  <li
                    key={s.heading}
                    className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 numu-fade-up"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <p className="text-sm font-semibold text-on-surface">{s.heading}</p>
                    <ul className="mt-2 space-y-1">
                      {s.points.map((p) => (
                        <li key={p} className="flex gap-2 text-xs leading-relaxed text-on-surface-variant">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5"
                >
                  {t("demo.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-xs text-on-surface-variant">{t("demo.ctaNote")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
