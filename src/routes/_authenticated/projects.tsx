import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { type ProjectRow } from "@/lib/mock-data";
import { listProjects } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Proyek — Numu AI" },
      { name: "description", content: "Semua proyek akademik kamu di satu tempat." },
    ],
  }),
  component: ProjectsPage,
});

type Tab = "all" | "active" | "done";

function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const listFn = useServerFn(listProjects);
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
  });
  const projects = (data ?? []) as ProjectRow[];
  const filtered = projects.filter((p) =>
    tab === "all" ? true : tab === "done" ? p.progress >= 100 : p.progress < 100,
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Proyek</h1>
            <p className="text-sm text-muted-foreground">
              Lanjutkan pekerjaan yang tertunda atau unduh hasil yang sudah selesai.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            Tambah Proyek
          </Link>
        </div>

        <div className="mt-8 inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {(
            [
              { id: "all", label: "Semua" },
              { id: "active", label: "Sedang berjalan" },
              { id: "done", label: "Selesai" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${
                tab === t.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada proyek di kategori ini.</p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-medium text-foreground hover:underline"
            >
              Mulai misi baru →
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}