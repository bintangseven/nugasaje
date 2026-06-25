import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";

interface MissionCardProps {
  missionType: "paper" | "presentation";
  icon: string;
  title: string;
  description: string;
  estimate: string;
  output: string;
  onStart: (missionType: "paper" | "presentation") => void;
  loading?: boolean;
}

export function MissionCard({
  missionType,
  icon,
  title,
  description,
  estimate,
  output,
  onStart,
  loading,
}: MissionCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
        {icon}
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {estimate}
        </span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>Output: {output}</span>
      </div>

      <button
        type="button"
        onClick={() => onStart(missionType)}
        disabled={loading}
        className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform group-hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Membuka…" : "Mulai Misi"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}