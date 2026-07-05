"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, Clock, MessageSquare, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus, EmployeeWithPresence } from "@/types/database";
import { STATUS_CONFIG, STATUS_OPTIONS } from "./status-config";

// ─── Validation Schema ────────────────────────────────────────────────────────

const schema = z
  .object({
    status: z.enum([
      "available", "busy", "in_meeting", "field_work", "remote", "offline",
    ] as const),
    notes: z.string().max(200).optional(),
    // busy context
    busy_description: z.string().optional(),
    busy_expected_finish: z.string().optional(),
    // in_meeting context
    meeting_title: z.string().optional(),
    meeting_end_time: z.string().optional(),
    // field_work context
    field_location: z.string().optional(),
    field_activity: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.status === "busy" && !d.busy_description?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["busy_description"], message: "وصف النشاط مطلوب" });
    }
    if (d.status === "in_meeting" && !d.meeting_title?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["meeting_title"], message: "عنوان الاجتماع مطلوب" });
    }
    if (d.status === "field_work" && !d.field_location?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["field_location"], message: "الموقع مطلوب" });
    }
  });

type FormData = z.infer<typeof schema>;

interface UpdateStatusDialogProps {
  employee: EmployeeWithPresence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateStatusDialog({ employee, open, onOpenChange }: UpdateStatusDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "available" },
  });

  const selectedStatus = watch("status");

  useEffect(() => {
    if (employee && open) {
      const s = employee.presence?.availability_status ?? "available";
      const ctx = employee.presence?.context;
      reset({
        status: s,
        notes: employee.presence?.notes ?? "",
        busy_description: (ctx as { description?: string })?.description ?? "",
        busy_expected_finish: (ctx as { expected_finish?: string })?.expected_finish ?? "",
        meeting_title: (ctx as { title?: string })?.title ?? "",
        meeting_end_time: (ctx as { end_time?: string })?.end_time ?? "",
        field_location: (ctx as { location?: string })?.location ?? "",
        field_activity: (ctx as { activity?: string })?.activity ?? "",
      });
    }
  }, [employee, open, reset]);

  async function onSubmit(data: FormData) {
    if (!employee) return;
    const supabase = createClient();

    // Build status context
    let context: Record<string, string> | null = null;
    if (data.status === "busy") {
      context = { description: data.busy_description ?? "" };
      if (data.busy_expected_finish) context.expected_finish = data.busy_expected_finish;
    } else if (data.status === "in_meeting") {
      context = { title: data.meeting_title ?? "" };
      if (data.meeting_end_time) context.end_time = data.meeting_end_time;
    } else if (data.status === "field_work") {
      context = { location: data.field_location ?? "" };
      if (data.field_activity) context.activity = data.field_activity;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("employee_presence") as any).upsert(
      {
        employee_id: employee.id,
        availability_status: data.status,
        workload_percent: employee.presence?.workload_percent ?? 0,
        notes: data.notes || null,
        context,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );

    if (error) { console.error("Presence update failed:", error); return; }

    // Activity log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("activity_logs") as any).insert({
      actor_id: employee.id,
      action: "status_changed",
      entity_type: "employee",
      entity_id: employee.id,
      new_values: { status: data.status, context },
    });

    onOpenChange(false);
  }

  if (!employee) return null;

  const initials = employee.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm font-bold bg-muted">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>تحديث الحالة</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{employee.full_name}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogBody>
            {/* Status grid */}
            <div className="space-y-2">
              <Label>الحالة الحالية</Label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const isSelected = selectedStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue("status", s as AvailabilityStatus, { shouldValidate: true })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all duration-150",
                        isSelected
                          ? `${cfg.badgeClass} border-current scale-[1.02] shadow-sm`
                          : "bg-muted/30 hover:bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      <span className={cn("w-3 h-3 rounded-full", cfg.dotClass, s === "available" && isSelected && "animate-pulse")} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Busy context */}
            {selectedStatus === "busy" && (
              <ContextSection color="red" icon={<MessageSquare className="h-3.5 w-3.5" />} title="تفاصيل النشاط">
                <Field label="وصف النشاط *" error={errors.busy_description?.message}>
                  <Textarea
                    placeholder="مثال: مراجعة العقود مع العميل..."
                    rows={2}
                    {...register("busy_description")}
                    className={errors.busy_description ? "border-destructive" : ""}
                  />
                </Field>
                <Field label="وقت الانتهاء المتوقع (اختياري)">
                  <Input type="datetime-local" dir="ltr" {...register("busy_expected_finish")} />
                </Field>
              </ContextSection>
            )}

            {/* In Meeting context */}
            {selectedStatus === "in_meeting" && (
              <ContextSection color="yellow" icon={<CalendarClock className="h-3.5 w-3.5" />} title="تفاصيل الاجتماع">
                <Field label="عنوان الاجتماع *" error={errors.meeting_title?.message}>
                  <Input
                    placeholder="مثال: اجتماع متابعة أسبوعي"
                    {...register("meeting_title")}
                    className={errors.meeting_title ? "border-destructive" : ""}
                  />
                </Field>
                <Field label="وقت الانتهاء (اختياري)">
                  <Input type="datetime-local" dir="ltr" {...register("meeting_end_time")} />
                </Field>
              </ContextSection>
            )}

            {/* Field Work context */}
            {selectedStatus === "field_work" && (
              <ContextSection color="blue" icon={<MapPin className="h-3.5 w-3.5" />} title="تفاصيل الجولة الميدانية">
                <Field label="الموقع *" error={errors.field_location?.message}>
                  <Input
                    placeholder="مثال: المشاعر المقدسة - منى"
                    {...register("field_location")}
                    className={errors.field_location ? "border-destructive" : ""}
                  />
                </Field>
                <Field label="سبب الجولة (اختياري)">
                  <Input placeholder="مثال: توزيع دفعة بطاقات نسك" {...register("field_activity")} />
                </Field>
              </ContextSection>
            )}

            {/* Notes (always visible) */}
            <Field label="ملاحظة إضافية (اختياري)" icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}>
              <Input placeholder="ملاحظة مختصرة..." {...register("notes")} />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ الحالة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function ContextSection({
  color,
  icon,
  title,
  children,
}: {
  color: "red" | "yellow" | "blue";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const colors = {
    red:    "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400",
    yellow: "border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400",
    blue:   "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
  };

  return (
    <div className={cn(
      "space-y-3 rounded-xl border p-4 animate-in fade-in-0 slide-in-from-top-2 duration-200",
      colors[color]
    )}>
      <p className={cn("text-xs font-semibold flex items-center gap-1.5", colors[color].split(" ").slice(-2).join(" "))}>
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
