import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MissionCard } from "@/components/MissionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { ArrowRight, Check, Sparkles, Zap, ShieldCheck, Clock3 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-auth";
import { defaultProjectName, missions, type MissionType, type ProjectRow } from "@/lib/mock-data";
import { createProject, listProjects } from "@/lib/projects.functions";
import { DashboardHome } from "@/components/DashboardHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Numu AI — Selesaikan tugas kuliahmu lebih cepat" },
      {
        name: "description",
        content:
          "Numu AI adalah ruang kerja akademik untuk mahasiswa Indonesia. Pilih misi, jawab beberapa pertanyaan, dan tugasmu selesai.",
      },
      { property: "og:title", content: "Numu AI" },
      {
        property: "og:description",
        content: "Ruang kerja akademik untuk menyelesaikan paper dan presentasi.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loaded } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: (mission: MissionType) =>
      createFn({ data: { mission, name: defaultProjectName(mission) } }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (row?.id) navigate({ to: "/mission/$id", params: { id: row.id } });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Gagal membuat proyek"),
  });

  function handleStart(mission: MissionType) {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    create.mutate(mission);
  }

  const recent = ((projectsQuery.data ?? []) as ProjectRow[]).slice(0, 3);

  if (loaded && user) {
    return <DashboardHome user={user} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        {/* HERO */}
        <section className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface-variant">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI penyusun tugas kuliah
            </span>
            <h1
              className="mt-5 font-display font-semibold text-on-surface"
              style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.6rem)", lineHeight: 1.08 }}
            >
              Makalah &amp; PPT kelar{" "}
              <span className="ai-gradient-text">dalam satu klik.</span>
            </h1>
            <p className="mt-6 max-w-[48ch] text-[1.08rem] leading-relaxed text-on-surface-variant">
              Pilih satu misi, jawab beberapa pertanyaan singkat, dan biarkan Numu AI
              menyusun struktur, isi, sampai daftar pustaka. Tinggal unduh, tinggal
              kumpulkan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => (user ? handleStart("paper") : navigate({ to: "/auth" }))}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary shadow-glow transition-all hover:-translate-y-0.5"
              >
                Mulai gratis
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#cara"
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-3.5 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary"
              >
                Lihat caranya
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Data tersimpan aman
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-primary" /> Hasil siap ≤ 3 menit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" /> Tanpa kartu kredit
              </span>
            </div>
          </Reveal>

          {/* Product mock — clean M3 card */}
          <Reveal delay={80}>
            <div
              className="relative mx-auto w-full max-w-md"
              style={{ transform: `translateY(${scrollY * -0.04}px)` }}
            >
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-70 blur-2xl"
                style={{ background: "var(--gradient-ai)" }}
              />
              <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-elegant">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                      Draft BAB I
                    </span>
                  </div>
                  <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-[10px] font-bold text-primary">
                    AI · Selesai
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">
                  Pengaruh Literasi Digital terhadap Minat Baca Mahasiswa
                </h3>
                <div className="mt-5 space-y-2.5">
                  {[92, 78, 85, 60, 92, 74].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full bg-surface-container"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${w}%`,
                          background: "var(--gradient-ai)",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { k: "Halaman", v: "12" },
                    { k: "Sitasi", v: "18" },
                    { k: "Format", v: "APA" },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className="rounded-xl bg-surface-container-low px-3 py-2 text-center"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {s.k}
                      </div>
                      <div className="mt-0.5 font-display text-base font-semibold text-on-surface">
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="misi" className="mt-20 scroll-mt-24">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">Dua alat · Satu alur kerja</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Dari topik kosong sampai file siap kumpul
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
          {missions.map((m, i) => (
            <Reveal key={m.id} delay={i * 90}>
              <MissionCard
                missionType={m.id}
                icon={m.icon}
                title={m.title}
                description={m.description}
                estimate={m.estimate}
                output={m.output}
                loading={create.isPending && create.variables === m.id}
                onStart={handleStart}
              />
            </Reveal>
          ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="cara" className="mt-24 scroll-mt-24">
          <Reveal className="mb-12 max-w-2xl">
            <span className="eyebrow">Cara memulai</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Tiga langkah, satu file siap kumpul
            </h2>
            <p className="mt-3 text-[1rem] text-on-surface-variant">
              Tidak perlu prompt panjang. Cukup jawab pertanyaan singkat, sisanya AI yang kerjakan.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Pilih misi",
                desc: "Tentukan apakah kamu butuh makalah atau presentasi. Satu klik, satu alur.",
              },
              {
                step: "02",
                title: "Isi brief singkat",
                desc: "Jawab beberapa pertanyaan: topik, gaya, jumlah bab/slide, dan referensi.",
              },
              {
                step: "03",
                title: "Unduh hasilnya",
                desc: "AI menyusun struktur, isi, dan daftar pustaka. Tinggal unduh .docx / .pptx.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 100}>
                <div className="bento-card group relative h-full overflow-hidden rounded-3xl p-7 transition-all hover:-translate-y-1">
                  <div
                    className="absolute -right-4 -top-8 font-display font-bold leading-none text-surface-container transition-transform group-hover:scale-110"
                    style={{ fontSize: "7rem" }}
                  >
                    {s.step}
                  </div>
                  <span className="eyebrow relative">Langkah {s.step}</span>
                  <h3 className="relative mt-3 font-display text-xl font-semibold text-on-surface">
                    {s.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="harga" className="mt-24 scroll-mt-24">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">Harga</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Mulai gratis, naik kelas saat butuh
            </h2>
            <p className="mt-3 text-[1rem] text-on-surface-variant">
              Promo pembukaan: paket Pro turun dari{" "}
              <span className="text-on-surface-variant/70 line-through">Rp100.000</span>{" "}
              jadi cuma <span className="mark-highlight font-semibold">Rp50.000 / bulan</span>.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {/* BASIC */}
            <Reveal>
              <div className="bento-card flex h-full flex-col rounded-3xl p-8 transition-all hover:-translate-y-1">
                <span className="eyebrow">Basic</span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-on-surface">
                  Gratis selamanya
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Cocok buat coba-coba dan tugas ringan.
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-on-surface">Rp0</span>
                  <span className="text-sm text-on-surface-variant">/bulan</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-on-surface">
                  {[
                    "2 submission per hari",
                    "Akses kedua misi (Makalah & PPT)",
                    "Riwayat proyek tersinkron",
                    "Unduh .docx & .pptx",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => (user ? navigate({ to: "/" }) : navigate({ to: "/auth" }))}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-transparent px-5 py-3 text-sm font-bold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  Mulai gratis
                </button>
              </div>
            </Reveal>

            {/* PRO */}
            <Reveal delay={100}>
              <div
                className="relative flex h-full flex-col overflow-hidden rounded-3xl p-8 shadow-glow"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--tertiary) 100%)",
                  color: "var(--on-primary)",
                }}
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(255,255,255,0.28), transparent 70%)" }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/80">
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
                  <span className="text-sm text-white/50 line-through">Rp100rb</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-white/90">
                  {[
                    "10 submission per hari",
                    "Prioritas antrian generate",
                    "Template PPT premium (Beautiful.ai)",
                    "Riwayat & ekspor tanpa batas",
                    "Dukungan via WhatsApp",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => (user ? navigate({ to: "/profile" }) : navigate({ to: "/auth" }))}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition-all hover:-translate-y-0.5"
                >
                  Upgrade ke Pro
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {user && (
        <section className="mt-20">
          <Reveal className="flex items-end justify-between">
            <div>
              <span className="eyebrow">Riwayat</span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-on-surface">
                Proyek Terbaru
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tersinkron otomatis di seluruh perangkatmu.
              </p>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-primary hover:underline"
            >
              Lihat semua →
            </Link>
          </Reveal>
          {projectsQuery.isLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-3xl border border-outline-variant bg-surface-container-low"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada proyek. Mulai misi di atas untuk membuat yang pertama.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {recent.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
        )}

        {/* FINAL CTA */}
        <section className="mt-24">
          <Reveal className="mb-12 max-w-2xl" >
            <span className="eyebrow">FAQ</span>
            <h2 id="faq" className="mt-3 scroll-mt-24 font-display text-3xl font-semibold md:text-4xl">
              Pertanyaan yang sering ditanya
            </h2>
          </Reveal>
          <div className="mb-24 grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Apakah hasilnya bisa diedit?",
                a: "Bisa. File .docx bisa dibuka di Word/Google Docs, dan .pptx bisa diedit di PowerPoint, Keynote, atau Canva. Semua isi bebas kamu ubah.",
              },
              {
                q: "Apakah hasilnya akan terdeteksi AI?",
                a: "Kami menyusun struktur dan kalimat ala mahasiswa, bukan hasil mentah model. Tapi tetap baca ulang, tambahkan referensi pribadi, dan sesuaikan gaya kamu sendiri sebelum dikumpulkan.",
              },
              {
                q: "Bagaimana kalau hasilnya kurang sesuai?",
                a: "Kamu bisa ulangi dengan brief yang lebih spesifik (tambah outline, gaya bahasa, atau lampirkan PDF referensi). Tiap submission gratis di paket Basic dan murah di Pro.",
              },
              {
                q: "Apakah datanya aman?",
                a: "Brief, jawaban, dan hasilmu hanya bisa diakses oleh akunmu sendiri. Lihat halaman kebijakan privasi untuk detail penyimpanan dan retensi.",
              },
              {
                q: "Bagaimana cara upgrade ke Pro?",
                a: "Masuk ke menu Profil dan tekan Upgrade. Selama masa promo, paket Pro hanya Rp50.000/bulan dengan 10 submission/hari.",
              },
              {
                q: "Bisa dipakai untuk skripsi/jurnal?",
                a: "Bisa untuk bab pendukung, ringkasan, dan kerangka. Untuk karya akhir, gunakan sebagai asisten — referensi dan analisis utama tetap perlu kamu validasi.",
              },
            ].map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="bento-card group rounded-2xl p-5 transition-all">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-semibold text-on-surface">
                    <span>{item.q}</span>
                    <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-outline-variant text-sm text-on-surface-variant transition-transform group-open:rotate-45">
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

          <Reveal>
            <div
              className="relative overflow-hidden rounded-3xl p-10 shadow-glow md:p-14"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--tertiary) 60%, var(--secondary) 100%)",
                color: "var(--on-primary)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)" }}
              />
              <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/80">
                    Siap mulai?
                  </span>
                  <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                    Deadline besok? <span className="underline decoration-white/60 underline-offset-4">Mulai sekarang.</span>
                  </h2>
                  <p className="mt-4 max-w-[48ch] text-[1rem] text-white/85">
                    Pilih satu misi, jawab brief singkat, dan biarkan Numu AI yang lembur.
                    Gratis untuk dicoba — tanpa kartu kredit.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <button
                    type="button"
                    onClick={() => (user ? handleStart("paper") : navigate({ to: "/auth" }))}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary transition-all hover:-translate-y-0.5"
                  >
                    Mulai misi pertama
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href="#harga"
                    className="text-sm font-semibold text-white/90 hover:text-white hover:underline"
                  >
                    Lihat paket Pro →
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
