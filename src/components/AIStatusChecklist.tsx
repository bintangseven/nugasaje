import { Check, Loader2 } from "lucide-react";

interface Props {
  steps: string[];
  currentIndex: number; // -1 = not started, steps.length = done
}

export function AIStatusChecklist({ steps, currentIndex }: Props) {
  return (
    <ul className="space-y-2">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li
            key={step}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-secondary text-foreground"
                : done
                  ? "text-foreground"
                  : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                done
                  ? "border-foreground bg-foreground text-background"
                  : active
                    ? "border-foreground/30 bg-card text-foreground"
                    : "border-border bg-card"
              }`}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : active ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
            </span>
            <span>{step}</span>
          </li>
        );
      })}
    </ul>
  );
}