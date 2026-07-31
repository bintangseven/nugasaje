import { useEffect, useState } from "react";
import { X, Lightbulb, FileText, Presentation, ChevronLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { MissionType } from "@/lib/mock-data";

const STORAGE_KEY = "numu:assistant-tips-dismissed";

const tips: Record<MissionType, string[]> = {
  paper: [
    "tips.paper.1",
    "tips.paper.2",
    "tips.paper.3",
    "tips.paper.4",
  ],
  presentation: [
    "tips.presentation.1",
    "tips.presentation.2",
    "tips.presentation.3",
    "tips.presentation.4",
  ],
};

export function AssistantTips({
  missionType,
  projectId,
}: {
  missionType: MissionType;
  projectId: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    try {
      const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (dismissed[projectId]) return;
    } catch {
      /* ignore */
    }
    // Muncul dengan sedikit delay agar tidak mengganggu saat halaman baru dibuka
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [projectId]);

  function handleClose() {
    setOpen(false);
    try {
      const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      dismissed[projectId] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    } catch {
      /* ignore */
    }
  }

  function nextTip() {
    setTipIndex((i) => (i + 1) % tips[missionType].length);
  }

  const Icon = missionType === "paper" ? FileText : Presentation;
  const currentTip = tips[missionType][tipIndex];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("tips.open")}
        className="fixed right-4 top-24 z-50 inline-flex items-center gap-2 rounded-full border border-outline/30 bg-secondary/90 px-3 py-2 text-xs font-semibold text-on-secondary shadow-lg backdrop-blur-xl transition-transform hover:scale-105"
      >
        <ChevronLeft className="h-4 w-4" />
        <Lightbulb className="h-4 w-4" />
        <span className="hidden sm:inline">{t("tips.open")}</span>
      </button>
    );
  }

  return (
    <div
      className="fixed right-4 top-24 z-50 w-[min(92vw,360px)] animate-in slide-in-from-right-8 fade-in duration-500"
      role="dialog"
      aria-label={t("tips.title")}
    >
      <div className="relative overflow-hidden rounded-2xl border border-outline/30 bg-surface/80 p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
        {/* Accent stripe */}
        <div className="absolute left-0 top-0 h-full w-1 bg-secondary" />

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-on-secondary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-on-surface">{t("tips.from")}</p>
                <p className="text-[11px] text-on-surface-variant">{t("tips.for")}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                aria-label={t("tips.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-container-high/70 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm leading-relaxed text-on-surface">{t(currentTip)}</p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant">
                {tipIndex + 1} / {tips[missionType].length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={nextTip}
                  className="text-xs font-medium text-secondary transition-colors hover:text-secondary-container"
                >
                  {t("tips.next")}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-on-secondary transition-colors hover:bg-secondary/90"
                >
                  {t("tips.gotIt")}
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
