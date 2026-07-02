"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Paperclip, FileText, ChevronDown, Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createTaskAction } from "@/app/(dashboard)/dashboard/assignments/actions";
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDuration } from "./card-utils";
import type { TaskPriority, TaskStatus, UserRole, Team } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: TaskPriority[] = ["urgent", "high", "medium", "low"];

const CREATABLE_STATUSES: TaskStatus[] = [
  "available",
  "pending",
  "in_progress",
  "on_hold",
];

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i); // 0–12
const MINUTE_OPTIONS = [0, 15, 30, 45];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  team_id: string;
  priority: TaskPriority;
  due_date: string;
  hours: number;
  minutes: number;
  status: TaskStatus;
  notes: string;
}

function defaultForm(employeeTeamId: string | null): FormState {
  return {
    title: "",
    description: "",
    team_id: employeeTeamId ?? "",
    priority: "high",
    due_date: "",
    hours: 0,
    minutes: 0,
    status: "available",
    notes: "",
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(f: FormState): string | null {
  if (!f.title.trim()) return "العنوان مطلوب";
  if (!f.description.trim()) return "الوصف مطلوب";
  if (!f.team_id) return "يجب اختيار الفريق";
  if (!f.due_date) return "تاريخ الاستحقاق مطلوب";
  return null;
}

// ─── Preview card ─────────────────────────────────────────────────────────────

function PreviewCard({
  form,
  teamName,
}: {
  form: FormState;
  teamName: string | null;
}) {
  const priorityCfg = PRIORITY_CONFIG[form.priority];
  const statusCfg = STATUS_CONFIG[form.status];
  const estimatedMinutes = form.hours * 60 + form.minutes;
  const hasContent = form.title || form.description || form.team_id || form.due_date;

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        معاينة المهمة
      </p>
      <div
        className={cn(
          "flex-1 rounded-xl border-2 border-dashed p-4 transition-all duration-200",
          hasContent
            ? "border-border bg-card"
            : "border-muted bg-muted/20"
        )}
      >
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-2">
            <Pin className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              ستظهر معاينة المهمة هنا
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start gap-2 justify-between">
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  priorityCfg.className
                )}
              >
                {priorityCfg.label}
              </span>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  statusCfg.className
                )}
              >
                {statusCfg.label}
              </span>
            </div>

            {/* Title */}
            <div>
              <p className="text-sm font-bold text-foreground leading-snug">
                {form.title || (
                  <span className="text-muted-foreground italic">عنوان المهمة…</span>
                )}
              </p>
              {form.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {form.description}
                </p>
              )}
            </div>

            <div className="border-t pt-3 space-y-1.5">
              {teamName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{teamName}</span>
                </div>
              )}
              {form.due_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    {new Date(form.due_date).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {estimatedMinutes > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{formatDuration(estimatedMinutes)}</span>
                </div>
              )}
              {form.notes && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-2">
                  <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{form.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface CreateTaskDialogProps {
  role: UserRole;
  teams: Team[];
  employeeTeamId: string | null;
}

export function CreateTaskDialog({
  role,
  teams,
  employeeTeamId,
}: CreateTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => defaultForm(employeeTeamId));
  const [error, setError] = useState<string | null>(null);

  const isTrackManager = role === "track_manager";
  const selectedTeam = teams.find((t) => t.id === form.team_id) ?? null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setForm(defaultForm(employeeTeamId));
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const estimatedMinutes = form.hours * 60 + form.minutes;

    startTransition(async () => {
      const { error: serverError } = await createTaskAction({
        title: form.title,
        description: form.description,
        team_id: form.team_id,
        priority: form.priority,
        due_date: form.due_date,
        estimated_minutes: estimatedMinutes > 0 ? estimatedMinutes : null,
        status: form.status,
        notes: form.notes || undefined,
      });

      if (serverError) {
        setError(serverError);
        return;
      }

      setOpen(false);
      setForm(defaultForm(employeeTeamId));
      toast.success("تم إنشاء المهمة بنجاح", {
        description: `"${form.title}" متاحة الآن للمطالبة بها`,
      });
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 ms-1" />
        إضافة مهمة
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col p-0"
          dir="rtl"
        >
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-xl">إنشاء مهمة جديدة</DialogTitle>
          </DialogHeader>

          {/* Body */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ── Form (left) ── */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-w-0 overflow-y-auto px-6 py-5 space-y-6"
            >
              {/* ── Section 1: Basic info ── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  المعلومات الأساسية
                </legend>
                <div className="space-y-1.5">
                  <Label htmlFor="task-title">
                    العنوان <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="task-title"
                    placeholder="وصف موجز للمهمة…"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-desc">
                    الوصف <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="task-desc"
                    placeholder="اشرح تفاصيل المهمة والمتطلبات…"
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
              </fieldset>

              {/* ── Section 2: Assignment ── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  التخصيص
                </legend>

                {/* Team */}
                <div className="space-y-1.5">
                  <Label htmlFor="task-team">
                    الفريق <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <select
                      id="task-team"
                      value={form.team_id}
                      onChange={(e) => set("team_id", e.target.value)}
                      disabled={isTrackManager}
                      className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pe-8 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">اختر الفريق</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label>الأولوية <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2 flex-wrap">
                    {PRIORITY_OPTIONS.map((p) => {
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => set("priority", p)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                            form.priority === p
                              ? cfg.className + " border-current shadow-sm ring-1 ring-current/30"
                              : "border-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </fieldset>

              {/* ── Section 3: Scheduling ── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  الجدولة
                </legend>

                <div className="grid grid-cols-2 gap-4">
                  {/* Due date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-due">
                      تاريخ الاستحقاق <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="task-due"
                      type="date"
                      value={form.due_date}
                      onChange={(e) => set("due_date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-status">الحالة</Label>
                    <div className="relative">
                      <select
                        id="task-status"
                        value={form.status}
                        onChange={(e) =>
                          set("status", e.target.value as TaskStatus)
                        }
                        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pe-8 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {CREATABLE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Estimated duration */}
                <div className="space-y-1.5">
                  <Label>المدة التقديرية</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={form.hours}
                        onChange={(e) =>
                          set("hours", parseInt(e.target.value, 10))
                        }
                        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pe-8 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {HOUR_OPTIONS.map((h) => (
                          <option key={h} value={h}>
                            {h} ساعة
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                      <select
                        value={form.minutes}
                        onChange={(e) =>
                          set("minutes", parseInt(e.target.value, 10))
                        }
                        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pe-8 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {MINUTE_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {m} دقيقة
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {(form.hours > 0 || form.minutes > 0) && (
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        = {formatDuration(form.hours * 60 + form.minutes)}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* ── Section 4: Optional ── */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  إضافات اختيارية
                </legend>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="task-notes">ملاحظات</Label>
                  <Textarea
                    id="task-notes"
                    placeholder="أي ملاحظات إضافية للفريق…"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>

                {/* Attachments — UI prepared, not functional yet */}
                <div className="space-y-1.5">
                  <Label>المرفقات</Label>
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-4 text-sm text-muted-foreground/50 cursor-not-allowed select-none"
                  >
                    <Paperclip className="h-4 w-4" />
                    رفع ملفات — قريباً
                  </button>
                </div>
              </fieldset>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}
            </form>

            {/* ── Preview (right) ── */}
            <div className="hidden lg:flex flex-col w-72 shrink-0 border-s bg-muted/20 px-5 py-5">
              <PreviewCard
                form={form}
                teamName={selectedTeam?.name ?? null}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-background shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              onClick={handleSubmit}
              className="min-w-[120px]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  جارٍ الحفظ…
                </span>
              ) : (
                "إنشاء المهمة"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
