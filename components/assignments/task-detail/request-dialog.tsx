"use client";

import { useState, useTransition } from "react";
import { Search, Users, Eye, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sendTaskRequestAction } from "@/app/(dashboard)/dashboard/assignments/[taskId]/actions";
import type { TeamMemberSummary } from "@/lib/data/task-detail";
import type { TaskRequestType } from "@/types/database";

interface Props {
  taskId: string;
  requestType: TaskRequestType;
  teamMembers: TeamMemberSummary[];
  existingParticipantIds: string[];
  currentEmployeeId: string;
  onClose: () => void;
}

export function RequestDialog({
  taskId,
  requestType,
  teamMembers,
  existingParticipantIds,
  currentEmployeeId,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const typeLabel = requestType === "collaboration" ? "مشاركة" : "مراجعة";
  const TypeIcon = requestType === "collaboration" ? Users : Eye;

  const eligible = teamMembers.filter(
    (m) =>
      m.id !== currentEmployeeId &&
      !existingParticipantIds.includes(m.id) &&
      m.full_name.includes(search)
  );

  function handleSend() {
    if (!selected) return;
    setServerError(null);
    startTransition(async () => {
      const { error } = await sendTaskRequestAction(taskId, selected, requestType);
      if (error) {
        setServerError(error);
      } else {
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            طلب {typeLabel}
          </DialogTitle>
          <DialogDescription>
            اختر موظفاً من فريقك لإرسال طلب {typeLabel} إليه.
          </DialogDescription>
        </DialogHeader>

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن موظف…"
            className="pe-9"
          />
        </div>

        {/* ── Member list ── */}
        <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "لا توجد نتائج." : "لا يوجد موظفون متاحون في فريقك."}
            </p>
          ) : (
            eligible.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(selected === m.id ? null : m.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors",
                  selected === m.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                    selected === m.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {m.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.full_name}</p>
                  {m.job_title && (
                    <p
                      className={cn(
                        "text-xs truncate",
                        selected === m.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {m.job_title}
                    </p>
                  )}
                </div>
                {selected === m.id && (
                  <div className="w-4 h-4 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Error ── */}
        {serverError && (
          <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            إلغاء
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!selected || isPending}
            className="gap-2"
          >
            <TypeIcon className="h-4 w-4" />
            {isPending ? "جاري الإرسال…" : `إرسال طلب ${typeLabel}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
