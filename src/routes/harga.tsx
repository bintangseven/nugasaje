import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { useCurrentUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/harga")({
  head: () => ({
    meta: [
      { title: "Harga — Numu AI" },
      {
        name: "description",
        content:
          "Pilih paket Numu AI yang cocok: Basic gratis selamanya atau Pro Rp50.000/bulan untuk 10 generate per hari.",
      },
      { property: "og:title", content: "Harga — Numu AI" },
      {
        property: "og:description",
        content:
          "Basic gratis selamanya. Pro Rp50.000/bulan (promo dari Rp100.000) — 10 generate per hari, template PPT premium, dukungan prioritas.",
      },
    ],
  }),
  component: HargaPage,
});

function HargaPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <Reveal className="mb-12 max-w-2xl">
          <span className="eyebrow">Harga</span>
          <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Mulai gratis, naik kelas saat butuh
          </h1>
          <p className="mt-4 text-[1rem]" style={{ color: "var(--graphite)" }}>
            Promo pembukaan: paket Pro turun dari{" "}
            <span className="line-through" style={{ color: "var(--ink-soft)" }}>Rp100.000</span>{" "}
            jadi cuma <span className="mark-highlight font-semibold">Rp50.000 / bulan</span>.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-[10px] border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-elegant">
              <span className="eyebrow">Basic</span>
              <h3 className="mt-3 font-display text-2xl font-semibold">Gratis selamanya</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--graphite)" }}>
                Cocok buat coba-coba dan tugas ringan.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold">Rp0</span>
                <span className="text-sm" style={{ color: "var(--graphite)" }}>/bulan</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--ink-soft)" }}>
                {[
                  "2 submission per hari",
                  "Akses kedua misi (Makalah & PPT)",
                  "Riwayat proyek tersinkron",
                  "Unduh .docx & .pptx",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--stamp)" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => (user ? navigate({ to: "/" }) : navigate({ to: "/auth" }))}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md border border-foreground bg-transparent px-5 py-3 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
              >
                Mulai gratis
              </button>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div
              className="relative flex h-full flex-col overflow-hidden rounded-[10px] p-8 text-background shadow-elegant"
              style={{ background: "var(--ink)" }}
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(244,211,94,0.35), transparent 70%)" }}
              />
              <div className="flex items-center justify-between">
                <span
                  className="font-mono-eyebrow uppercase"
                  style={{ fontSize: "0.72rem", letterSpacing: "0.16em", color: "var(--highlighter)" }}
                >
                  ● Pro
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider"
                  style={{ background: "var(--stamp)", color: "var(--paper)" }}
                >
                  <Sparkles className="h-3 w-3" />
                  Promo 50%
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold">Buat yang serius</h3>
              <p className="mt-2 text-sm" style={{ color: "rgba(250,246,236,0.7)" }}>
                Untuk minggu UTS, UAS, dan revisi dosen yang nggak ada habisnya.
              </p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold">Rp50rb</span>
                <span className="text-sm" style={{ color: "rgba(250,246,236,0.65)" }}>/bulan</span>
                <span className="text-sm line-through" style={{ color: "rgba(250,246,236,0.45)" }}>
                  Rp100rb
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-sm" style={{ color: "rgba(250,246,236,0.92)" }}>
                {[
                  "10 submission per hari",
                  "Prioritas antrian generate",
                  "Template PPT premium (Beautiful.ai)",
                  "Riwayat & ekspor tanpa batas",
                  "Dukungan via WhatsApp",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--highlighter)" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => (user ? navigate({ to: "/profile" }) : navigate({ to: "/auth" }))}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--highlighter)", color: "var(--ink)" }}
              >
                Upgrade ke Pro
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}