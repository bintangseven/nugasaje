import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  ArrowRight,
  FileText,
  Presentation,
  Trash2,
  Loader2,
  FolderOpen,
  MoreHorizontal,
  Copy,
  Pencil,
  Pin,
  PinOff,
} from "lucide-react";
import { formatRelativeTime, type ProjectRow } from "@/lib/mock-data";
import { deleteProject, duplicateProject, updateProject } from "@/lib/projects.functions";
import { exportProject } from "@/lib/export.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ProjectCard({
  project,
  pinned = false,
  onTogglePin,
  compact = false,
}: {
  project: ProjectRow;
  pinned?: boolean;
  onTogglePin?: (id: string) => void;
  compact?: boolean;
}) {
  const completed = project.progress >= 100;
  const Icon = project.mission === "paper" ? FileText : Presentation;
  const missionLabel = project.mission === "paper" ? "Paper" : "Presentasi";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameVal, setRenameVal] = useState(project.name);
  const deleteFn = useServerFn(deleteProject);
  const duplicateFn = useServerFn(duplicateProject);
  const updateFn = useServerFn(updateProject);
  const exportFn = useServerFn(exportProject);
  const [downloading, setDownloading] = useState(false);
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: project.id } }),
    onSuccess: () => {
      toast.success("Proyek dihapus");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menghapus proyek"),
  });
  const dup = useMutation({
    mutationFn: () => duplicateFn({ data: { id: project.id } }),
    onSuccess: () => {
      toast.success("Proyek diduplikasi");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menduplikasi"),
  });
  const rename = useMutation({
    mutationFn: (name: string) =>
      updateFn({ data: { id: project.id, patch: { name } } }),
    onSuccess: () => {
      toast.success("Nama diperbarui");
      setRenameOpen(false);
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal mengubah nama"),
  });

  async function handleDownload() {
    if (downloading) return;
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh file");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md ${
        pinned ? "border-amber-300/70 ring-1 ring-amber-200/50" : "border-border hover:border-foreground/25"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-on-secondary">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {missionLabel}
          </span>
          {pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              <Pin className="h-2.5 w-2.5" /> Pin
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {formatRelativeTime(project.updated_at)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Aksi proyek"
                className="rounded-md p-1 text-muted-foreground opacity-70 transition-colors hover:bg-secondary hover:text-foreground group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onTogglePin && (
                <DropdownMenuItem onSelect={() => onTogglePin(project.id)}>
                  {pinned ? (
                    <>
                      <PinOff className="mr-2 h-3.5 w-3.5" /> Lepas pin
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-3.5 w-3.5" /> Sematkan
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setRenameVal(project.name);
                  setRenameOpen(true);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" /> Ubah nama
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={dup.isPending}
                onSelect={() => dup.mutate()}
              >
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplikasi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h3 className={`mt-3 line-clamp-2 font-semibold leading-snug text-foreground ${compact ? "text-sm" : "text-[15px]"}`}>
        {project.name}
      </h3>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${completed ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs font-medium text-foreground">
          {project.progress}%
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {completed ? (
          <>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Unduh
            </button>
            <Link
              to="/mission/$id"
              params={{ id: project.id }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Buka proyek
            </Link>
          </>
        ) : (
          <Link
            to="/mission/$id"
            params={{ id: project.id }}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
          >
            Lanjutkan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus proyek ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Proyek <span className="font-medium text-foreground">“{project.name}”</span> akan
              dihapus selamanya beserta seluruh jawaban dan hasilnya. Tindakan ini tidak bisa
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending ? "Menghapus…" : "Hapus selamanya"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah nama proyek</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            maxLength={200}
            placeholder="Nama proyek"
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameVal.trim()) rename.mutate(renameVal.trim());
            }}
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!renameVal.trim() || rename.isPending}
              onClick={() => rename.mutate(renameVal.trim())}
              className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {rename.isPending ? "Menyimpan…" : "Simpan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}