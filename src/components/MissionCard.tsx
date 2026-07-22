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
    <div className="group relative flex flex-col rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-2xl text-primary">
        {icon}
      </div>
      <span className="eyebrow mb-2">{missionType === "paper" ? "Makalah AI" : "PPT AI"}</span>
      <h3 className="font-display text-2xl font-semibold text-on-surface">{title}</h3>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-on-surface-variant">{description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {estimate}
        </span>
        <span className="h-1 w-1 rounded-full bg-outline-variant" />
        <span>Output: {output}</span>
      </div>

      <button
        type="button"
        onClick={() => onStart(missionType)}
        disabled={loading}
        className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-glow transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Membuka…" : "Mulai Misi"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}