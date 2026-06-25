import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { mockProjects } from "@/lib/mock-data";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Proyek — Student OS" },
      { name: "description", content: "Semua proyek akademik kamu di satu tempat." },
    ],
  }),
  component: ProjectsPage,
});

type Tab = "all" | "active" | "done";

function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const filtered = mockProjects.filter((p) =>
    tab === "all" ? true : tab === "done" ? p.progress >= 100 : p.progress < 100,
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Proyek</h1>
          <p className="text-sm text-muted-foreground">
            Lanjutkan pekerjaan yang tertunda atau unduh hasil yang sudah selesai.
          </p>
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

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada proyek di kategori ini.</p>
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