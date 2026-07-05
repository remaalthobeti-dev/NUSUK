"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateMyStatusAction } from "@/app/(dashboard)/dashboard/actions";
import { STATUS_CONFIG, STATUS_OPTIONS } from "@/components/dashboard/status-config";
import type { AvailabilityStatus } from "@/types/database";
import { toast } from "sonner";

// Statuses that support an optional description note
const NOTE_PROMPTS: Partial<Record<AvailabilityStatus, string>> = {
  busy:       "بماذا أنت مشغول؟",
  in_meeting: "موضوع الاجتماع",
  field_work: "موقع أو سبب الجولة",
  remote:     "سبب الخروج من المكتب",
};

interface MyStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: AvailabilityStatus;
  currentNote?: string | null;
  onSuccess?: () => void;
}

export function MyStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  currentNote,
  onSuccess,
}: MyStatusDialogProps) {
  const [selected, setSelected] = useState<AvailabilityStatus>(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [isPending, startTransition] = useTransition();

  // Reset form when dialog opens
  function handleOpenChange(v: boolean) {
    if (v) {
      setSelected(currentStatus);
      setNote(currentNote ?? "");
    }
    onOpenChange(v);
  }

  function handleStatusSelect(s: AvailabilityStatus) {
    setSelected(s);
    // Clear note when switching to a status that doesn't support notes
    if (!NOTE_PROMPTS[s]) setNote("");
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateMyStatusAction(selected, NOTE_PROMPTS[selected] ? note : undefined);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`تم تغيير حالتك إلى ${STATUS_CONFIG[selected].label}`);
        onOpenChange(false);
        onSuccess?.();
      }
    });
  }

  const notePrompt = NOTE_PROMPTS[selected];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>تغيير حالتي</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status grid */}
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = selected === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusSelect(s)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all duration-150",
                    isActive
                      ? `${cfg.badgeClass} border-current scale-[1.02] shadow-sm`
                      : "bg-muted/30 hover:bg-muted text-muted-foreground border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full",
                      cfg.dotClass,
                      s === "available" && isActive && "animate-pulse"
                    )}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Optional description for applicable statuses */}
          {notePrompt && (
            <div
              className={cn(
                "space-y-2 rounded-xl border p-3 animate-in fade-in-0 slide-in-from-top-2 duration-200",
                STATUS_CONFIG[selected].badgeClass
              )}
            >
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[selected].dotClass)} />
                {notePrompt}
                <span className="font-normal text-muted-foreground">(اختياري)</span>
              </Label>
              <div className="relative">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 60))}
                  placeholder={getNotePlaceholder(selected)}
                  className="bg-background text-xs"
                  maxLength={60}
                />
                <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground select-none">
                  {note.length}/60
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
            حفظ الحالة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getNotePlaceholder(status: AvailabilityStatus): string {
  switch (status) {
    case "busy":       return "مثال: مراجعة بطاقات نسك";
    case "in_meeting": return "مثال: اجتماع مع شركة الراجحي";
    case "field_work": return "مثال: جولة في المشاعر المقدسة";
    case "remote":     return "مثال: متابعة خارج المقر";
    default:           return "";
  }
}
