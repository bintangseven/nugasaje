import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";

interface MissionCardProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  estimate: string;
  output: string;
}

export function MissionCard({
  id,
  icon,
  title,
  description,
  estimate,
  output,
}: MissionCardProps) {
  return (
    <Link
      to="/mission/$id"
      params={{ id }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
    >
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

      <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform group-hover:translate-x-0.5">
        Mulai Misi
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}