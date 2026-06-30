import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MissionCard } from "@/components/MissionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { useCurrentUser } from "@/hooks/use-auth";
import { defaultProjectName, missions, type MissionType, type ProjectRow } from "@/lib/mock-data";
import { createProject, listProjects } from "@/lib/projects.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nugasinaje — Selesaikan tugas kuliahmu lebih cepat" },
      {
        name: "description",
        content:
          "Nugasinaje adalah ruang kerja akademik untuk mahasiswa Indonesia. Pilih misi, jawab beberapa pertanyaan, dan tugasmu selesai.",
      },
      { property: "og:title", content: "Nugasinaje" },
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
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = paperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -y * 8, ry: x * 10 });
  }
  function handleLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

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

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        <section className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <span className="eyebrow">AI penyusun tugas kuliah</span>
            <h1 className="mt-5 font-display font-semibold" style={{ fontSize: "clamp(2.4rem, 4.6vw, 3.6rem)" }}>
              Makalah &amp; PPT kelar <span className="mark-highlight">dalam satu klik.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[1.08rem] leading-relaxed" style={{ color: "var(--graphite)" }}>
              Pilih satu misi, jawab beberapa pertanyaan singkat, dan biarkan Nugasinaje menyusun
              struktur, isi, sampai daftar pustaka. Tinggal unduh, tinggal kumpulkan.
            </p>
          {loaded && !user && (
            <p className="mt-5 text-sm" style={{ color: "var(--graphite)" }}>
              <Link to="/auth" className="font-medium text-foreground hover:underline">
                Masuk
              </Link>{" "}
              untuk menyimpan proyekmu dan melanjutkannya dari perangkat manapun.
            </p>
          )}
          </Reveal>

          <div
            className="relative flex min-h-[420px] items-center justify-center"
            style={{ perspective: "1200px" }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          >
            <div
              ref={paperRef}
              className="relative w-[300px] rounded-[4px] bg-white p-8 shadow-elegant"
              style={{
                transform: `translateY(${scrollY * -0.06}px) rotate(${-2.4 + tilt.ry * 0.2}deg) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: "transform 200ms cubic-bezier(.22,.61,.36,1)",
                transformStyle: "preserve-3d",
                backgroundImage:
                  "repeating-linear-gradient(#FFFFFF 0px, #FFFFFF 27px, var(--line) 28px)",
              }}
            >
              <div
                className="absolute font-hand"
                style={{
                  top: "-18px",
                  left: "-30px",
                  transform: "rotate(-7deg)",
                  background: "var(--highlighter)",
                  color: "var(--stamp-deep)",
                  padding: "8px 14px",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  boxShadow: "0 8px 16px -8px rgba(0,0,0,0.25)",
                }}
              >
                Revisi bab 3 malam ini? aman.
              </div>
              <span
                className="font-mono-eyebrow inline-block bg-white"
                style={{ fontSize: "0.66rem", color: "var(--graphite)" }}
              >
                BAB I — PENDAHULUAN
              </span>
              <div className="mt-2 inline-block bg-white font-display text-[1.05rem] font-semibold">
                Pengaruh Literasi Digital terhadap Minat Baca Mahasiswa
              </div>
              {["92%", "78%", "85%", "60%", "92%", "78%"].map((w, i) => (
                <div
                  key={i}
                  className="my-3.5 h-2 rounded-[2px] animate-pulse"
                  style={{ width: w, background: "#E7E1D2", animationDelay: `${i * 120}ms`, animationDuration: "2.6s" }}
                />
              ))}
              <svg
                className="absolute"
                style={{ right: "-26px", bottom: "-22px", width: 128, height: 128, transform: "rotate(-11deg)" }}
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g fill="none" stroke="#B23A2F" strokeWidth="3.4" opacity="0.92">
                  <circle cx="100" cy="100" r="86" />
                  <circle cx="100" cy="100" r="74" />
                </g>
                <text x="100" y="92" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="22" fontWeight="700" fill="#B23A2F">ACC</text>
                <text x="100" y="120" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="11" letterSpacing="2" fill="#B23A2F">NUGASINAJE</text>
                <path d="M70 132 L92 150 L132 108" stroke="#B23A2F" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">Dua alat, satu alur kerja</span>
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

        {user && (
        <section className="mt-20">
          <Reveal className="flex items-end justify-between">
            <div>
              <span className="eyebrow">Riwayat</span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                Proyek Terbaru
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--graphite)" }}>
                Tersinkron otomatis di seluruh perangkatmu.
              </p>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Lihat semua →
            </Link>
          </Reveal>
          {projectsQuery.isLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
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
      </main>
    </div>
  );
}
