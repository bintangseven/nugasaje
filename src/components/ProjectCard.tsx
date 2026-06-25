import { Link } from "@tanstack/react-router";
import { Download, ArrowRight, FileText, Presentation } from "lucide-react";
import type { Project } from "@/lib/mock-data";

export function ProjectCard({ project }: { project: Project }) {
  const completed = project.progress >= 100;
  const Icon = project.mission === "paper" ? FileText : Presentation;
  const missionLabel = project.mission === "paper" ? "Paper" : "Presentasi";

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {missionLabel}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{project.updatedAt}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
        {project.name}
      </h3>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs font-medium text-foreground">
          {project.progress}%
        </span>
      </div>

      <div className="mt-5">
        {completed ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh
          </button>
        ) : (
          <Link
            to="/mission/$id"
            params={{ id: project.mission }}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
          >
            Lanjutkan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}