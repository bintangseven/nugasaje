import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Download, Loader2, Paperclip, Send, Sparkles, Cloud, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AIStatusChecklist } from "@/components/AIStatusChecklist";
import {
  missionQuestions,
  missions,
  paperSteps,
  presentationSteps,
  type MissionType,
  type ProjectPhase,
  type ProjectRow,
} from "@/lib/mock-data";
import { getProject, updateProject } from "@/lib/projects.functions";
import { generateProjectContent } from "@/lib/ai.functions";
import { exportProject } from "@/lib/export.functions";
import { TemplatePicker } from "@/components/TemplatePicker";
import { DEFAULT_TEMPLATE_ID } from "@/lib/pptx-templates";
import { BeautifulThemePicker } from "@/components/BeautifulThemePicker";

export const Route = createFileRoute("/_authenticated/mission/$id")({
  head: () => ({
    meta: [
      { title: "Misi — Nugasinaje" },
      { name: "description", content: "Ruang kerja misi akademik di Nugasinaje." },
    ],
  }),
  component: MissionWorkspace,
});

type SaveStatus = "idle" | "saving" | "saved" | "error";

function MissionWorkspace() {
  const { id } = useParams({ from: "/_authenticated/mission/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getFn = useServerFn(getProject);
  const updateFn = useServerFn(updateProject);
  const generateFn = useServerFn(generateProjectContent);
  const exportFn = useServerFn(exportProject);

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => getFn({ data: { id } }),
  });

  // Redirect if project not found
  useEffect(() => {
    if (projectQuery.isSuccess && !projectQuery.data) {
      toast.error("Proyek tidak ditemukan");
      navigate({ to: "/projects" });
    }
  }, [projectQuery.isSuccess, projectQuery.data, navigate]);

  if (projectQuery.isLoading || !projectQuery.data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memuat proyek…
        </div>
      </div>
    );
  }

  return (
    <Workspace
      project={projectQuery.data as ProjectRow}
      updateFn={updateFn}
      generateFn={generateFn}
      exportFn={exportFn}
      queryClient={queryClient}
    />
  );
}

function Workspace({
  project,
  updateFn,
  generateFn,
  exportFn,
  queryClient,
}: {
  project: ProjectRow;
  updateFn: ReturnType<typeof useServerFn<typeof updateProject>>;
  generateFn: ReturnType<typeof useServerFn<typeof generateProjectContent>>;
  exportFn: ReturnType<typeof useServerFn<typeof exportProject>>;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const missionType: MissionType = project.mission;
  const mission = missions.find((m) => m.id === missionType)!;
  const questions = missionQuestions[missionType];
  const steps = missionType === "paper" ? paperSteps : presentationSteps;

  // Local mirror of server state — hydrated once from the loaded project.
  const [name, setName] = useState(project.name);
  const [qIndex, setQIndex] = useState(project.question_index ?? 0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    (project.answers ?? {}) as Record<string, string>,
  );
  const [phase, setPhase] = useState<ProjectPhase>(project.phase);
  const [stepIndex, setStepIndex] = useState<number>(project.step_index ?? -1);
  const [draft, setDraft] = useState("");
  const [templateId, setTemplateId] = useState<string>(
    ((project.answers ?? {}) as Record<string, string>).__template ?? DEFAULT_TEMPLATE_ID,
  );
  const [beautifyTheme, setBeautifyTheme] = useState<string>(
    ((project.answers ?? {}) as Record<string, string>).__beautify_theme ?? "",
  );
  const [attachment, setAttachment] = useState<{ name: string; mime: string; base64: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [qIndex, phase]);

  // Debounced auto-save to cloud whenever local state changes.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(
    (patch: Partial<{
      name: string;
      phase: "interview" | "working" | "done";
      progress: number;
      step_index: number;
      question_index: number;
      answers: Record<string, string>;
      ai_context: Record<string, unknown>;
    }>) => {
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateFn({ data: { id: project.id, patch } });
          setSaveStatus("saved");
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        } catch (err) {
          setSaveStatus("error");
          toast.error(err instanceof Error ? err.message : "Auto-save gagal");
        }
      }, 600);
    },
    [project.id, updateFn, queryClient],
  );

  // Reset "saved" indicator after a moment.
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  const interviewDone = qIndex >= questions.length;

  // AI generation: step animation runs while a real Lovable AI call is in flight.
  // When the server fn resolves it sets phase=done in the DB; we refetch the project.
  const aiCallRef = useRef<Promise<unknown> | null>(null);
  useEffect(() => {
    if (phase !== "working") return;
    if (!aiCallRef.current) return;
    const totalSteps = steps.length;
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      setStepIndex((i) => {
        const next = Math.min(i + 1, totalSteps - 1);
        return next;
      });
    }, 1600);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase, steps.length]);

  const progress =
    phase === "done"
      ? 100
      : phase === "working"
        ? Math.min(95, 30 + Math.round((Math.max(0, stepIndex) / steps.length) * 65))
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
    commitAnswer(draft.trim());
  }

  function commitAnswer(value: string) {
    if (interviewDone) return;
    const newAnswers = { ...answers, [questions[qIndex].id]: value };
    const newQIndex = qIndex + 1;
    setAnswers(newAnswers);
    setQIndex(newQIndex);
    setDraft("");

    // Auto-name the project from the topic answer.
    let nextName = name;
    if (questions[qIndex].id === "topic" && !project.answers?.topic) {
      const topic = value.slice(0, 80);
      nextName = `${missionType === "paper" ? "Paper" : "Presentasi"} - ${topic}`;
      setName(nextName);
    }

    scheduleSave({
      answers: newAnswers,
      question_index: newQIndex,
      progress: Math.round((newQIndex / questions.length) * 25),
      ...(nextName !== name ? { name: nextName } : {}),
    });
  }

  async function startGeneration() {
    setPhase("working");
    setStepIndex(0);
    // Persist template choice (for presentation) along with phase change.
    const nextAnswers =
      missionType === "presentation"
        ? { ...answers, __template: templateId, __beautify_theme: beautifyTheme }
        : undefined;
    if (nextAnswers) setAnswers(nextAnswers);
    scheduleSave({
      phase: "working",
      step_index: 0,
      progress: 30,
      ...(nextAnswers ? { answers: nextAnswers } : {}),
    });
    try {
      const p = generateFn({
        data: {
          id: project.id,
          ...(attachment
            ? { attachment: { name: attachment.name, mime: attachment.mime, base64: attachment.base64 } }
            : {}),
        },
      });
      aiCallRef.current = p;
      await p;
      setPhase("done");
      setStepIndex(steps.length);
      await queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Konten siap! Klik unduh untuk menyimpan file.");
    } catch (err) {
      setPhase("interview");
      setStepIndex(-1);
      scheduleSave({ phase: "interview", step_index: -1, progress: 25 });
      toast.error(err instanceof Error ? err.message : "Gagal menjalankan AI");
    } finally {
      aiCallRef.current = null;
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      toast.error("Ukuran file maks 10MB.");
      return;
    }
    const allowed = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    const mime = file.type || "application/octet-stream";
    if (!allowed.includes(mime)) {
      toast.error("Format didukung: PDF, TXT, MD, JPG, PNG, WEBP.");
      return;
    }
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const base64 = btoa(bin);
    setAttachment({ name: file.name, mime, base64, size: file.size });
    toast.success(`Lampiran "${file.name}" siap dipakai.`);
  }

  const [downloading, setDownloading] = useState(false);
  async function handleDownload(openCanva = false) {
    if (phase !== "done") return;
    setDownloading(true);
    try {
      const res = await exportFn({ data: { id: project.id } });
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: res.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (openCanva) {
        window.open("https://www.canva.com/import", "_blank", "noopener,noreferrer");
        toast.success("File terunduh. Upload .pptx-nya di tab Canva yang baru terbuka.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengekspor file";
      toast.error(msg);
      if (msg.includes("Konten AI belum")) {
        setPhase("interview");
        setStepIndex(-1);
        await queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke proyek
          </Link>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>{mission.icon}</span>
                {mission.title}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <SaveIndicator status={saveStatus} />
              <span className="text-xs text-muted-foreground">Sisa waktu {remaining}</span>
              <button
                type="button"
                disabled={phase !== "done" || downloading}
                onClick={() => handleDownload(false)}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Unduh {missionType === "paper" ? ".docx" : ".pptx"}
              </button>
              {missionType === "presentation" && (
                <button
                  type="button"
                  disabled={phase !== "done" || downloading}
                  onClick={() => handleDownload(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  Buka di Canva
                </button>
              )}
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

            {!interviewDone && <Bubble role="ai">{questions[qIndex].question}</Bubble>}

            {interviewDone && phase === "interview" && (
              <Bubble role="ai">
                Aku punya semua yang aku butuhkan. Klik <strong>Mulai kerjakan</strong> dan aku
                akan menyusun {missionType === "paper" ? "papermu" : "presentasimu"}.
              </Bubble>
            )}

            {phase === "working" && (
              <Bubble role="ai">Sedang aku kerjakan. Kamu bisa rebahan sebentar 🌿</Bubble>
            )}

            {phase === "done" && (
              <Bubble role="ai">
                Selesai! File siap diunduh dan diedit di Word
                {missionType === "presentation" ? " / PowerPoint" : ""}.
              </Bubble>
            )}
          </div>

          {phase === "interview" && !interviewDone && (
            <div className="mt-4 border-t border-border pt-4">
              {questions[qIndex].type === "choice" ? (
                <div className="space-y-2">
                  {(questions[qIndex].options ?? []).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => commitAnswer(opt)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-foreground/30 hover:bg-secondary"
                    >
                      {opt}
                    </button>
                  ))}
                  <div className="pt-1 text-xs text-muted-foreground">
                    Pertanyaan {qIndex + 1} dari {questions.length}
                  </div>
                </div>
              ) : (
                <form onSubmit={submitAnswer}>
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
            </div>
          )}

          {phase === "interview" && interviewDone && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              {missionType === "presentation" && (
                <>
                  <BeautifulThemePicker value={beautifyTheme} onChange={setBeautifyTheme} />
                  <TemplatePicker value={templateId} onChange={setTemplateId} />
                </>
              )}
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground">Lampiran (opsional)</div>
                <p className="text-[11px] text-muted-foreground">
                  Unggah materi referensi (PDF, TXT, MD, atau gambar, maks 10MB). AI akan
                  menjadikannya bahan utama.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,image/jpeg,image/png,image/webp"
                  onChange={handleFilePick}
                  className="hidden"
                />
                {attachment ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{attachment.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {(attachment.size / 1024).toFixed(0)} KB
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Hapus lampiran"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Pilih file
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={startGeneration}
                className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Mulai kerjakan
              </button>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6 lg:col-span-3">
          <div className="flex min-h-[360px] flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Preview</h2>
              <span className="text-xs text-muted-foreground">
                {missionType === "paper" ? "Dokumen Word" : "Slide PowerPoint"}
              </span>
            </div>

            {phase === "interview" && <EmptyPreview missionType={missionType} />}

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

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Cloud className="h-3.5 w-3.5 animate-pulse" />
        Menyimpan…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5" />
        Tersimpan
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-destructive">Gagal menyimpan</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Cloud className="h-3.5 w-3.5" />
      Sinkron
    </span>
  );
}

function Bubble({ role, children }: { role: "ai" | "user"; children: React.ReactNode }) {
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
          Preview akan muncul di sini saat aku mulai menyusun
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
  phase: ProjectPhase;
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
  phase: ProjectPhase;
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