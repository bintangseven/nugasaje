import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Typewriter, CountUp } from "@/components/Typewriter";
import { MissionCard } from "@/components/MissionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Clock3, Brain, FileInput, FileDown, Gauge, Users, Star } from "lucide-react";
import { Quote } from "lucide-react";
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
      { property: "og:title", content: "Numu AI — Selesaikan tugas kuliahmu lebih cepat" },
      {
        property: "og:description",
        content: "Numu AI adalah ruang kerja akademik untuk mahasiswa Indonesia. Pilih misi, jawab beberapa pertanyaan, dan tugasmu selesai.",
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
  const [headlineDone, setHeadlineDone] = useState(false);
  const [subDone, setSubDone] = useState(false);

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
              AI Research Assistant
            </span>
            <h1
              className="mt-5 font-display font-semibold text-on-surface"
              style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.6rem)", lineHeight: 1.08 }}
            >
              <Typewriter
                text="Makalah & PPT kelar "
                speed={38}
                caret={false}
                onDone={() => setHeadlineDone(true)}
              />
              {headlineDone && (
                <Typewriter
                  text="dalam satu klik."
                  speed={45}
                  className="ai-gradient-text"
                />
              )}
            </h1>
            <p className="mt-6 min-h-[5.5rem] max-w-[48ch] text-[1.08rem] leading-relaxed text-on-surface-variant">
              {headlineDone && (
                <Typewriter
                  text="Pilih satu misi, jawab beberapa pertanyaan singkat, dan biarkan Numu AI menyusun struktur, isi, sampai daftar pustaka."
                  speed={14}
                  startDelay={200}
                  onDone={() => setSubDone(true)}
                />
              )}
            </p>

            <div
              className="mt-8 flex flex-wrap items-center gap-3"
              style={{
                opacity: subDone ? 1 : 0,
                transform: subDone ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 500ms ease, transform 500ms ease",
              }}
            >
              <button
                type="button"
                onClick={() => (user ? handleStart("paper") : navigate({ to: "/auth" }))}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary shadow-glow transition-all hover:-translate-y-0.5"
              >
                Mulai gratis
                <ArrowRight className="h-4 w-4 numu-arrow-nudge group-hover:animate-none group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#cara"
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-3.5 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary"
              >
                Lihat caranya
              </a>
            </div>

            <div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant"
              style={{
                opacity: subDone ? 1 : 0,
                transition: "opacity 700ms ease 200ms",
              }}
            >
              <span className="inline-flex items-center gap-1.5 numu-fade-up" style={{ animationDelay: "200ms" }}>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Data tersimpan aman
              </span>
              <span className="inline-flex items-center gap-1.5 numu-fade-up" style={{ animationDelay: "340ms" }}>
                <Clock3 className="h-3.5 w-3.5 text-primary" /> Hasil siap ≤ 3 menit
              </span>
              <span className="inline-flex items-center gap-1.5 numu-fade-up" style={{ animationDelay: "480ms" }}>
                <Zap className="h-3.5 w-3.5 text-primary" /> Tanpa kartu kredit
              </span>
            </div>
          </Reveal>

          {/* Process flow diagram with animated data trail */}
          <Reveal delay={80}>
            <div
              className="relative mx-auto w-full max-w-md numu-float"
              style={{ transform: `translateY(${scrollY * -0.04}px)` }}
            >
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] blur-2xl numu-halo"
                style={{ background: "var(--gradient-ai)" }}
              />
              <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-elegant">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                      Alur proses
                    </span>
                  </div>
                  <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-[10px] font-bold text-primary">
                    LIVE
                  </span>
                </div>

                {/* Flow: Input → AI → Output */}
                <div className="relative mt-6">
                  <svg
                    className="absolute inset-x-0 top-1/2 -z-0 h-8 w-full -translate-y-1/2"
                    viewBox="0 0 300 20"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M 30 10 L 150 10"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="numu-flow-path"
                      fill="none"
                    />
                    <path
                      d="M 150 10 L 270 10"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="numu-flow-path"
                      style={{ animationDelay: "-0.8s" }}
                      fill="none"
                    />
                  </svg>
                  <div className="relative z-10 grid grid-cols-3 items-center">
                    <FlowNode icon={<FileInput className="h-5 w-5" />} label="Input Data" />
                    <FlowNode icon={<Brain className="h-5 w-5" />} label="AI Analysis" glow />
                    <FlowNode icon={<FileDown className="h-5 w-5" />} label="Output" />
                  </div>
                </div>

                <h3 className="mt-6 font-display text-base font-semibold text-on-surface">
                  Dari brief singkat ke file siap kumpul
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatBox
                    icon={<Gauge className="h-4 w-4" />}
                    label="Akurasi"
                    value={<CountUp to={95} startDelay={400} suffix="%" />}
                    prefix=">"
                  />
                  <StatBox
                    icon={<Users className="h-4 w-4" />}
                    label="Mahasiswa"
                    value={<CountUp to={12} startDelay={550} suffix="K+" />}
                  />
                  <StatBox
                    icon={<Star className="h-4 w-4" />}
                    label="Rating"
                    value={<CountUp to={4.9} decimals={1} startDelay={700} />}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="misi" className="mt-20 scroll-mt-24">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">Research tools Terpercaya</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Dari topik kosong sampai file siap kumpul
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
          {missions.map((m, i) => (
            <Reveal key={m.id} delay={i * 90}>
              <MissionCard
                missionType={m.id}
                icon={m.icon}
                title={m.id === "paper" ? "Paper Research" : "Presentation"}
                description={m.description}
                estimate={m.estimate}
                output={m.output}
                loading={create.isPending && create.variables === m.id}
                onStart={handleStart}
              />
            </Reveal>
          ))}
          <Reveal delay={missions.length * 90}>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 opacity-90">
              <span className="absolute right-4 top-4 rounded-full bg-tertiary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-on-tertiary-container">
                Coming soon
              </span>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-container text-on-tertiary-container">
                <Quote className="h-5 w-5" />
              </div>
              <span className="eyebrow mb-2">Sitasi AI</span>
              <h3 className="font-display text-2xl font-semibold text-on-surface">
                Citation Finder
              </h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-on-surface-variant">
                Cari, validasi, dan format sitasi APA/IEEE otomatis dari jurnal terpercaya pasca-2020.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Segera hadir
                </span>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span>Output: BibTeX / .docx</span>
              </div>
              <button
                type="button"
                disabled
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-5 py-3 text-sm font-semibold text-on-surface-variant"
              >
                Coming soon
              </button>
            </div>
          </Reveal>
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
                  <Link
                    to="/harga"
                    className="text-sm font-semibold text-white/90 hover:text-white hover:underline"
                  >
                    Lihat paket Pro →
                  </Link>
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

function FlowNode({
  icon,
  label,
  glow,
}: {
  icon: React.ReactNode;
  label: string;
  glow?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest text-primary numu-icon-hover ${
          glow ? "numu-pulse-ring" : ""
        }`}
      >
        {icon}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  prefix,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  prefix?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-low px-3 py-2.5 text-center transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <span className="numu-icon-hover text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1 font-display text-base font-semibold text-on-surface">
        {prefix}
        {value}
      </div>
    </div>
  );
}
