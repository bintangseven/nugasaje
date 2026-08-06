import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { deleteAllProjects } from "@/lib/projects.functions";
import { useT } from "@/lib/i18n";

function fmt(s: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
    s,
  );
}

export function DeleteAllProjectsButton({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const deleteAllFn = useServerFn(deleteAllProjects);

  const del = useMutation({
    mutationFn: () => deleteAllFn(),
    onSuccess: (res) => {
      setOpen(false);
      toast.success(fmt(t("bulk.done"), { n: res?.deleted ?? count }));
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message || t("bulk.fail")),
  });

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground ${className}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {t("bulk.deleteAll")}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulk.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {fmt(t("bulk.confirmDesc"), { n: count })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>
              {t("bulk.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                del.mutate();
              }}
              disabled={del.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending ? t("bulk.deleting") : t("bulk.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}