"use client";

import { useTransition } from "react";
import { Loader2, AlertTriangle, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { archiveTeamAction, deleteTeamAction } from "@/app/(dashboard)/dashboard/teams/actions";
import type { TeamWithStats } from "@/lib/data/teams-management";

interface Props {
  team: TeamWithStats | null;
  mode: "archive" | "delete";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveConfirmDialog({ team, mode, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!team) return null;

  const isDelete = mode === "delete";

  function onConfirm() {
    if (!team) return;
    startTransition(async () => {
      const { error } = isDelete
        ? await deleteTeamAction(team.id)
        : await archiveTeamAction(team.id);

      if (error) {
        toast.error(error);
      } else {
        toast.success(isDelete ? "تم حذف الفريق نهائياً" : "تم أرشفة الفريق");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDelete ? "bg-destructive/10" : "bg-amber-500/10"
              }`}
            >
              {isDelete ? (
                <Trash2 className="h-5 w-5 text-destructive" />
              ) : (
                <Archive className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <DialogTitle>
              {isDelete ? "حذف الفريق نهائياً" : "أرشفة الفريق"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isDelete
              ? "هذا الإجراء لا يمكن التراجع عنه."
              : "يمكن استعادة الفريق لاحقاً."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${team.color}22` }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: team.color }} />
              </div>
              <div>
                <p className="font-semibold text-sm">{team.name}</p>
                {team.name_en && (
                  <p className="text-xs text-muted-foreground" dir="ltr">{team.name_en}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-background rounded-lg p-2 border">
                <p className="text-base font-bold tabular-nums">{team.memberCount}</p>
                <p className="text-[10px] text-muted-foreground">موظف</p>
              </div>
              <div className="bg-background rounded-lg p-2 border">
                <p className="text-base font-bold tabular-nums">{team.stats.inProgressTasks}</p>
                <p className="text-[10px] text-muted-foreground">مهمة جارية</p>
              </div>
              <div className="bg-background rounded-lg p-2 border">
                <p className="text-base font-bold tabular-nums">{team.stats.completedTasks}</p>
                <p className="text-[10px] text-muted-foreground">مكتملة</p>
              </div>
            </div>
          </div>

          {isDelete && team.memberCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 mt-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                لا يمكن حذف فريق يضم {team.memberCount} موظف نشط. أرشف الفريق أولاً أو انقل الموظفين إلى فريق آخر.
              </p>
            </div>
          )}

          {!isDelete && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              سيتوقف الفريق عن الظهور في اللوحة الرئيسية ويمكن استعادته من إدارة الفرق.
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant={isDelete ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending || (isDelete && team.memberCount > 0)}
            className={!isDelete ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDelete ? "حذف نهائياً" : "أرشفة الفريق"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
