import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Download, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AIStatusChecklist } from "@/components/AIStatusChecklist";
import {
  missionQuestions,
  missions,
  paperSteps,
  presentationSteps,
  type MissionType,
} from "@/lib/mock-data";

export const Route = createFileRoute("/mission/$id")({
  head: () => ({
    meta: [
      { title: "Misi — Student OS" },
      { name: "description", content: "Ruang kerja misi akademik di Student OS." },
    ],
  }),
  component: MissionWorkspace,
});

type Phase = "interview" | "working" | "done";

function MissionWorkspace() {
  const { id } = useParams({ from: "/mission/$id" });
  const missionType: MissionType = id === "presentation" ? "presentation" : "paper";
  const mission = missions.find((m) => m.id === missionType)!;
  const questions = missionQuestions[missionType];
  const steps = missionType === "paper" ? paperSteps : presentationSteps;

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>("interview");
  const [stepIndex, setStepIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [qIndex, phase]);

  // Simulate progress
  useEffect(() => {
    if (phase !== "working") return;
    setStepIndex(0);
    const totalSteps = steps.length;
    const interval = setInterval(() => {
      setStepIndex((i) => {
        if (i + 1 >= totalSteps) {
          clearInterval(interval);
          setPhase("done");
          return totalSteps;
        }
        return i + 1;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [phase, steps.length]);

  const interviewDone = qIndex >= questions.length;
  const progress =
    phase === "done"
      ? 100
      : phase === "working"
        ? Math.min(
            95,
            30 + Math.round((Math.max(0, stepIndex) / steps.length) * 65),
          )
        : Math.round((qIndex / questions.length) * 25);

  const remaining = useMemo(() => {
    if (phase === "done") return "Selesai";
    if (phase === "working") {
      const left = Math.max(0, steps.length - Math.max(0, stepIndex));
      return `± ${left * 2} menit`;
    }
    return missionType === "paper" ? "± 15 menit" : "± 10 menit";
  }, [phase, stepIndex, steps.length, missionType]);

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || interviewDone) return;
    setAnswers((a) => ({ ...a, [questions[qIndex].id]: draft.trim() }));
    setDraft("");
    setQIndex((i) => i + 1);
  }

  function startGeneration() {
    setPhase("working");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      {/* Mission top bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke beranda
          </Link>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>{mission.icon}</span>
                Misi
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {mission.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Sisa waktu {remaining}</span>
              <button
                type="button"
                disabled={phase !== "done"}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Unduh {missionType === "paper" ? ".docx" : ".pptx"}
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs font-medium text-foreground">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-8 lg:grid-cols-5">
        {/* Assistant */}
        <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">Asisten</h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {questions.slice(0, qIndex).map((q) => (
              <div key={q.id} className="space-y-2">
                <Bubble role="ai">{q.question}</Bubble>
                <Bubble role="user">{answers[q.id]}</Bubble>
              </div>
            ))}

            {!interviewDone && (
              <Bubble role="ai">{questions[qIndex].question}</Bubble>
            )}

            {interviewDone && phase === "interview" && (
              <Bubble role="ai">
                Aku punya semua yang aku butuhkan. Klik <strong>Mulai kerjakan</strong> dan
                aku akan menyusun {missionType === "paper" ? "papermu" : "presentasimu"}.
              </Bubble>
            )}

            {phase === "working" && (
              <Bubble role="ai">Sedang aku kerjakan. Kamu bisa rebahan sebentar 🌿</Bubble>
            )}

            {phase === "done" && (
              <Bubble role="ai">
                Selesai! File siap diunduh dan diedit di Word{" "}
                {missionType === "presentation" && "/ PowerPoint"}.
              </Bubble>
            )}
          </div>

          {phase === "interview" && !interviewDone && (
            <form onSubmit={submitAnswer} className="mt-4 border-t border-border pt-4">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={questions[qIndex].placeholder}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Pertanyaan {qIndex + 1} dari {questions.length}
                </span>
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lanjut
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}

          {phase === "interview" && interviewDone && (
            <button
              type="button"
              onClick={startGeneration}
              className="mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Mulai kerjakan
            </button>
          )}
        </section>

        {/* Preview + status */}
        <section className="flex flex-col gap-6 lg:col-span-3">
          <div className="flex min-h-[360px] flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Pratinjau</h2>
              <span className="text-xs text-muted-foreground">
                {missionType === "paper" ? "Dokumen Word" : "Slide PowerPoint"}
              </span>
            </div>

            {phase === "interview" && (
              <EmptyPreview missionType={missionType} />
            )}

            {phase !== "interview" && missionType === "paper" && (
              <PaperPreview answers={answers} phase={phase} stepIndex={stepIndex} />
            )}

            {phase !== "interview" && missionType === "presentation" && (
              <SlidesPreview answers={answers} phase={phase} stepIndex={stepIndex} />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Aktivitas AI</h2>
            <AIStatusChecklist steps={steps} currentIndex={stepIndex} />
          </div>
        </section>
      </main>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "ai" | "user";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
        role === "ai"
          ? "bg-secondary text-foreground"
          : "ml-auto bg-foreground text-background"
      }`}
    >
      {children}
    </div>
  );
}

function EmptyPreview({ missionType }: { missionType: MissionType }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="rounded-xl border border-dashed border-border bg-background/50 px-8 py-10">
        <p className="text-sm text-muted-foreground">
          Pratinjau akan muncul di sini saat aku mulai menyusun
          {missionType === "paper" ? " paper" : " slide"}.
        </p>
      </div>
    </div>
  );
}

function PaperPreview({
  answers,
  phase,
  stepIndex,
}: {
  answers: Record<string, string>;
  phase: Phase;
  stepIndex: number;
}) {
  const topic = answers.topic || "Topik Paper";
  const course = answers.course || "Mata Kuliah";
  const sections = [
    { title: "Cover", show: stepIndex >= 1 || phase === "done" },
    { title: "Daftar Isi", show: stepIndex >= 1 || phase === "done" },
    { title: "Pendahuluan", show: stepIndex >= 2 || phase === "done" },
    { title: "Pembahasan", show: stepIndex >= 3 || phase === "done" },
    { title: "Kesimpulan", show: stepIndex >= 4 || phase === "done" },
    { title: "Referensi", show: stepIndex >= 5 || phase === "done" },
  ];
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-sm">
      <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {course}
      </p>
      <h3 className="mt-3 text-center text-base font-semibold text-foreground">{topic}</h3>
      <div className="mt-6 space-y-2">
        {sections.map((s) => (
          <div
            key={s.title}
            className={`flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs transition-opacity ${
              s.show ? "opacity-100" : "opacity-30"
            }`}
          >
            <span className="font-medium text-foreground">{s.title}</span>
            <span className="text-muted-foreground">
              {s.show ? (phase === "done" ? "Selesai" : "Tertulis") : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlidesPreview({
  answers,
  phase,
  stepIndex,
}: {
  answers: Record<string, string>;
  phase: Phase;
  stepIndex: number;
}) {
  const topic = answers.topic || "Topik Presentasi";
  const slides = ["Judul", "Latar Belakang", "Pembahasan", "Studi Kasus", "Kesimpulan", "Terima Kasih"];
  const visibleCount = phase === "done" ? slides.length : Math.max(1, stepIndex + 1);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slides.map((title, i) => {
        const visible = i < visibleCount;
        return (
          <div
            key={title}
            className={`aspect-video rounded-lg border bg-background p-3 transition-opacity ${
              visible ? "border-border opacity-100" : "border-dashed border-border opacity-30"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Slide {i + 1}
            </p>
            <p className="mt-1 line-clamp-3 text-xs font-medium text-foreground">
              {i === 0 ? topic : title}
            </p>
          </div>
        );
      })}
    </div>
  );
}