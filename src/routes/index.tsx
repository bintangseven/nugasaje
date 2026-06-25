import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { MissionCard } from "@/components/MissionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { missions, mockProjects } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student OS — Selesaikan tugas kuliahmu lebih cepat" },
      {
        name: "description",
        content:
          "Student OS adalah ruang kerja akademik untuk mahasiswa Indonesia. Pilih misi, jawab beberapa pertanyaan, dan tugasmu selesai.",
      },
      { property: "og:title", content: "Student OS" },
      {
        property: "og:description",
        content: "Ruang kerja akademik untuk menyelesaikan paper dan presentasi.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const recent = mockProjects.slice(0, 3);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ruang kerja akademik
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Mau menyelesaikan apa hari ini?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Pilih satu misi. Jawab beberapa pertanyaan singkat. Student OS akan
            mengerjakan sisanya hingga file final siap dikumpulkan.
          </p>
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          {missions.map((m) => (
            <MissionCard
              key={m.id}
              id={m.id}
              icon={m.icon}
              title={m.title}
              description={m.description}
              estimate={m.estimate}
              output={m.output}
            />
          ))}
        </section>

        <section className="mt-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Proyek Terbaru
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lanjutkan tepat dari titik kamu berhenti.
              </p>
            </div>
            <a
              href="/projects"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Lihat semua →
            </a>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
