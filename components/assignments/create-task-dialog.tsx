"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Paperclip, FileText, ChevronDown, Pin, X } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import {
  createTaskAction,
  updateTaskAttachmentsAction,
} from "@/app/(dashboard)/dashboard/assignments/actions";
import type { TaskAttachment } from "@/app/(dashboard)/dashboard/assignments/actions";
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

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const SELECT_CLASS =
  "w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pe-8 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

// ─── Arabic Date Picker ───────────────────────────────────────────────────────
// Replaces <input type="date"> which reverses Arabic characters in RTL context.

function ArabicDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const parsed = value ? value.split("-").map(Number) : null;
  const selYear = parsed?.[0] ?? 0;
  const selMonth = parsed?.[1] ?? 0;
  const selDay = parsed?.[2] ?? 0;

  const daysInMonth =
    selYear && selMonth ? new Date(selYear, selMonth, 0).getDate() : 31;

  function emit(y: number, m: number, d: number) {
    if (!y || !m || !d) { onChange(""); return; }
    const clampedD = Math.min(d, new Date(y, m, 0).getDate());
    onChange(
      `${y}-${String(m).padStart(2, "0")}-${String(clampedD).padStart(2, "0")}`
    );
  }

  return (
    <div className="flex gap-2">
      {/* Day */}
      <div className="relative flex-1">
        <select
          value={selDay || ""}
          onChange={(e) => emit(selYear, selMonth, Number(e.target.value))}
          className={SELECT_CLASS}
        >
          <option value="">اليوم</option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Month */}
      <div className="relative flex-[2]">
        <select
          value={selMonth || ""}
          onChange={(e) => emit(selYear, Number(e.target.value), selDay)}
          className={SELECT_CLASS}
        >
          <option value="">الشهر</option>
          {ARABIC_MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Year */}
      <div className="relative flex-1">
        <select
          value={selYear || ""}
          onChange={(e) => emit(Number(e.target.value), selMonth, selDay)}
          className={SELECT_CLASS}
        >
          <option value="">السنة</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

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
          hasContent ? "border-border bg-card" : "border-muted bg-muted/20"
        )}
      >
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-2">
            <Pin className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">ستظهر معاينة المهمة هنا</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                    {new Date(form.due_date + "T12:00:00").toLocaleDateString("ar-SA", {
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
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTrackManager = role === "track_manager";
  const selectedTeam = teams.find((t) => t.id === form.team_id) ?? null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose(next: boolean) {
    if (!next) {
      setForm(defaultForm(employeeTeamId));
      setError(null);
      setStagedFiles([]);
    }
    setOpen(next);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length > 0) setStagedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }
    setError(null);

    const estimatedMinutes = form.hours * 60 + form.minutes;
    const titleSnapshot = form.title;
    const filesSnapshot = [...stagedFiles];

    startTransition(async () => {
      const { error: serverError, id: taskId } = await createTaskAction({
        title: form.title,
        description: form.description,
        team_id: form.team_id,
        priority: form.priority,
        due_date: form.due_date,
        estimated_minutes: estimatedMinutes > 0 ? estimatedMinutes : null,
        status: form.status,
        notes: form.notes || undefined,
      });

      if (serverError) { setError(serverError); return; }

      // Upload staged files and link them to the created task
      let attachmentCount = 0;
      if (filesSnapshot.length > 0 && taskId) {
        try {
          const supabase = createClient();
          const uploaded: TaskAttachment[] = [];

          for (const file of filesSnapshot) {
            const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const path = `${taskId}/${crypto.randomUUID()}-${safeName}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from("task-attachments")
              .upload(path, file);

            if (!uploadErr && uploadData) {
              const { data: urlData } = supabase.storage
                .from("task-attachments")
                .getPublicUrl(uploadData.path);
              uploaded.push({
                name: file.name,
                url: urlData.publicUrl,
                size: file.size,
                type: file.type,
              });
            }
          }

          if (uploaded.length > 0) {
            await updateTaskAttachmentsAction(taskId, uploaded);
            attachmentCount = uploaded.length;
          }

          if (uploaded.length < filesSnapshot.length) {
            toast.warning(
              `تم رفع ${uploaded.length} من أصل ${filesSnapshot.length} ملفات فقط`
            );
          }
        } catch {
          toast.warning("تم إنشاء المهمة لكن فشل رفع المرفقات");
        }
      }

      setOpen(false);
      setForm(defaultForm(employeeTeamId));
      setStagedFiles([]);
      toast.success("تم إنشاء المهمة بنجاح", {
        description:
          attachmentCount > 0
            ? `"${titleSnapshot}" مع ${attachmentCount} مرفق`
            : `"${titleSnapshot}" متاحة الآن للمطالبة بها`,
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

      {/* Hidden file input — outside Dialog to avoid portal issues */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

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
            {/* ── Form ── */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-w-0 overflow-y-auto px-6 py-5 space-y-6"
            >
              {/* Section 1: Basic info */}
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

              {/* Section 2: Assignment */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  التخصيص
                </legend>

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
                      className={SELECT_CLASS}
                    >
                      <option value="">اختر الفريق</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute inset-y-0 end-2.5 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    الأولوية <span className="text-destructive">*</span>
                  </Label>
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
                              ? cfg.className +
                                  " border-current shadow-sm ring-1 ring-current/30"
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

              {/* Section 3: Scheduling */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  الجدولة
                </legend>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>
                      تاريخ الاستحقاق{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <ArabicDatePicker
                      value={form.due_date}
                      onChange={(v) => set("due_date", v)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="task-status">الحالة</Label>
                    <div className="relative">
                      <select
                        id="task-status"
                        value={form.status}
                        onChange={(e) =>
                          set("status", e.target.value as TaskStatus)
                        }
                        className={SELECT_CLASS}
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

                <div className="space-y-1.5">
                  <Label>المدة التقديرية</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={form.hours}
                        onChange={(e) =>
                          set("hours", parseInt(e.target.value, 10))
                        }
                        className={SELECT_CLASS}
                      >
                        {HOUR_OPTIONS.map((h) => (
                          <option key={h} value={h}>{h} ساعة</option>
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
                        className={SELECT_CLASS}
                      >
                        {MINUTE_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m} دقيقة</option>
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

              {/* Section 4: Optional */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  إضافات اختيارية
                </legend>

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

                {/* Attachments */}
                <div className="space-y-2">
                  <Label>المرفقات</Label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                    اضغط لإضافة مرفقات
                  </button>

                  {stagedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {stagedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>

              {error && (
                <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}
            </form>

            {/* ── Preview (desktop only) ── */}
            <div className="hidden lg:flex flex-col w-72 shrink-0 border-s bg-muted/20 px-5 py-5">
              <PreviewCard form={form} teamName={selectedTeam?.name ?? null} />
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
