import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { MissionCard } from "@/components/MissionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { useCurrentUser } from "@/hooks/use-auth";
import { defaultProjectName, missions, type MissionType, type ProjectRow } from "@/lib/mock-data";
import { createProject, listProjects } from "@/lib/projects.functions";

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
  const { user, loaded } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);

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
          {loaded && !user && (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/auth" className="font-medium text-foreground hover:underline">
                Masuk
              </Link>{" "}
              untuk menyimpan proyekmu dan melanjutkannya dari perangkat manapun.
            </p>
          )}
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          {missions.map((m) => (
            <MissionCard
              key={m.id}
              missionType={m.id}
              icon={m.icon}
              title={m.title}
              description={m.description}
              estimate={m.estimate}
              output={m.output}
              loading={create.isPending && create.variables === m.id}
              onStart={handleStart}
            />
          ))}
        </section>

        {user && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Proyek Terbaru
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tersinkron otomatis di seluruh perangkatmu.
              </p>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Lihat semua →
            </Link>
          </div>
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
              {recent.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  );
}
