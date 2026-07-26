import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Loader2, Crown, ShieldCheck } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { useCurrentUser } from "@/hooks/use-auth";
import { createProUpgradeInvoice } from "@/lib/payments.functions";
import { getProfile } from "@/lib/projects.functions";

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
  const upgradeFn = useServerFn(createProUpgradeInvoice);
  const profileFn = useServerFn(getProfile);
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileFn(),
    enabled: !!user,
  });
  const profile = profileQuery.data;
  const isProActive =
    !!profile &&
    profile.plan === "pro" &&
    (!profile.pro_until || new Date(profile.pro_until).getTime() > Date.now());
  const proUntilLabel = profile?.pro_until
    ? new Date(profile.pro_until).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const upgrade = useMutation({
    mutationFn: () => upgradeFn(),
    onSuccess: (res) => {
      if (res?.invoice_url) window.location.href = res.invoice_url;
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Gagal membuat invoice"),
  });

  function handleUpgrade() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (isProActive) {
      toast.info(
        proUntilLabel
          ? `Kamu sudah PRO — aktif sampai ${proUntilLabel}.`
          : "Kamu sudah PRO aktif.",
      );
      return;
    }
    upgrade.mutate();
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <Reveal className="mb-14 max-w-2xl">
          <span className="eyebrow">Harga</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Mulai gratis, naik kelas saat butuh
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-on-surface-variant">
            Promo pembukaan: paket Pro turun dari{" "}
            <span className="line-through text-outline">Rp100.000</span>{" "}
            jadi cuma <span className="font-semibold text-primary">Rp50.000 / bulan</span>.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
              <span className="eyebrow">Basic</span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-on-surface">Gratis selamanya</h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                Cocok buat coba-coba dan tugas ringan.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-on-surface">Rp0</span>
                <span className="text-sm text-on-surface-variant">/bulan</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-on-surface-variant">
                {[
                  "2 submission per hari",
                  "Akses kedua misi (Makalah & PPT)",
                  "Riwayat proyek tersinkron",
                  "Unduh .docx & .pptx",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => (user ? navigate({ to: "/" }) : navigate({ to: "/auth" }))}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                Mulai gratis
              </button>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div
              className="relative flex h-full flex-col overflow-hidden rounded-3xl p-8 text-on-primary shadow-elegant"
              style={{ background: "var(--gradient-ai)" }}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)" }}
              />
              <div className="flex items-center justify-between">
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.85)" }}>
                  ● Pro
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Promo 50%
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold">Buat yang serius</h3>
              <p className="mt-2 text-sm text-white/75">
                Untuk minggu UTS, UAS, dan revisi dosen yang nggak ada habisnya.
              </p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold">Rp50rb</span>
                <span className="text-sm text-white/70">/bulan</span>
                <span className="text-sm line-through text-white/50">Rp100rb</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-white/90">
                {[
                  "10 submission per hari",
                  "Prioritas antrian generate",
                  "Preview PPT & Makalah in-app",
                  "Riwayat & ekspor tanpa batas",
                  "Dukungan via WhatsApp",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgrade.isPending}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
              >
                {upgrade.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyiapkan pembayaran…
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Upgrade ke Pro
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}