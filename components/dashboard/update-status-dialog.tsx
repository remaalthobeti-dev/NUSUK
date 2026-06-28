"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

// Supabase TypeScript inference workaround — cast via unknown to bypass never[] inference
type PresenceInsert = Database["public"]["Tables"]["employee_presence"]["Insert"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type ActivityInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus, EmployeeWithPresence } from "@/types/database";
import { STATUS_CONFIG } from "./status-config";

const schema = z
  .object({
    status: z.enum([
      "available",
      "busy",
      "break",
      "meeting",
      "outside_office",
      "remote",
    ] as const),
    notes: z.string().max(200).optional(),
    workload: z.coerce.number().min(0).max(100).default(0),
    task_title: z.string().optional(),
    task_description: z.string().optional(),
    estimated_hours: z.coerce.number().min(0.5).max(24).optional(),
    priority: z
      .enum(["low", "medium", "high", "urgent"] as const)
      .optional(),
    progress: z.coerce.number().min(0).max(100).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.status === "busy") {
      if (!data.task_title?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["task_title"],
          message: "اسم المهمة مطلوب",
        });
      }
      if (!data.estimated_hours) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimated_hours"],
          message: "الوقت المقدر مطلوب",
        });
      }
      if (!data.priority) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["priority"],
          message: "الأولوية مطلوبة",
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: AvailabilityStatus[] = [
  "available",
  "busy",
  "break",
  "meeting",
  "outside_office",
  "remote",
];

interface UpdateStatusDialogProps {
  employee: EmployeeWithPresence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateStatusDialog({
  employee,
  open,
  onOpenChange,
}: UpdateStatusDialogProps) {
  const [progressVal, setProgressVal] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: employee?.presence?.availability_status ?? "available",
      notes: employee?.presence?.notes ?? "",
      workload: employee?.presence?.workload_percent ?? 0,
      priority: "medium",
      progress: 0,
    },
  });

  const selectedStatus = watch("status");

  // Reset form when employee changes
  useEffect(() => {
    if (employee && open) {
      reset({
        status: employee.presence?.availability_status ?? "available",
        notes: employee.presence?.notes ?? "",
        workload: employee.presence?.workload_percent ?? 0,
        priority: "medium",
        progress: 0,
        task_title: "",
        task_description: "",
        estimated_hours: undefined,
      });
      setProgressVal(0);
    }
  }, [employee, open, reset]);

  async function onSubmit(data: FormData) {
    if (!employee) return;
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: presenceError } = await (supabase.from("employee_presence") as any).upsert(
      {
        employee_id: employee.id,
        availability_status: data.status,
        workload_percent: data.workload,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );

    if (presenceError) {
      console.error("Presence update failed:", presenceError);
      return;
    }

    // If busy, create a new task
    if (data.status === "busy" && data.task_title) {
      const dueDate = new Date(
        Date.now() + (data.estimated_hours ?? 1) * 3_600_000
      ).toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("tasks") as any).insert({
        title: data.task_title,
        description: data.task_description || null,
        status: "in_progress",
        priority: data.priority ?? "medium",
        team_id: employee.team_id,
        assigned_to: employee.id,
        started_at: new Date().toISOString(),
        due_date: dueDate,
      });
    }

    // Activity log entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("activity_logs") as any).insert({
      actor_id: employee.id,
      action: "status_changed",
      entity_type: "employee",
      entity_id: employee.id,
      new_values: {
        status: data.status,
        ...(data.task_title ? { task: data.task_title } : {}),
      },
    });

    onOpenChange(false);
  }

  if (!employee) return null;

  const initials = employee.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm font-bold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>تحديث الحالة</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {employee.full_name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogBody>
            {/* Status selection */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const isSelected = selectedStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue("status", s, { shouldValidate: true })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all duration-150",
                        isSelected
                          ? `${cfg.badgeClass} border-current scale-[1.02] shadow-sm`
                          : "bg-muted/30 hover:bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "w-3 h-3 rounded-full",
                          cfg.dotClass,
                          s === "available" && isSelected && "animate-pulse"
                        )}
                      />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>

            {/* Busy: task fields */}
            {selectedStatus === "busy" && (
              <div className="space-y-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  تفاصيل المهمة (مطلوبة)
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="task_title">اسم المهمة</Label>
                  <Input
                    id="task_title"
                    placeholder="مثال: مراجعة التقارير الأسبوعية"
                    {...register("task_title")}
                    className={errors.task_title ? "border-destructive" : ""}
                  />
                  {errors.task_title && (
                    <p className="text-xs text-destructive">
                      {errors.task_title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task_description">الوصف (اختياري)</Label>
                  <Textarea
                    id="task_description"
                    placeholder="وصف مختصر للمهمة..."
                    rows={2}
                    {...register("task_description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="estimated_hours">الوقت المقدر (ساعات)</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      min={0.5}
                      max={24}
                      step={0.5}
                      placeholder="1.5"
                      dir="ltr"
                      {...register("estimated_hours")}
                      className={errors.estimated_hours ? "border-destructive" : ""}
                    />
                    {errors.estimated_hours && (
                      <p className="text-xs text-destructive">
                        {errors.estimated_hours.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>الأولوية</Label>
                    <Select
                      defaultValue="medium"
                      onValueChange={(v) =>
                        setValue("priority", v as FormData["priority"])
                      }
                    >
                      <SelectTrigger
                        className={errors.priority ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="اختر الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="urgent">عاجلة</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.priority && (
                      <p className="text-xs text-destructive">
                        {errors.priority.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>الإنجاز الحالي</Label>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {progressVal}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressVal}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setProgressVal(v);
                      setValue("progress", v);
                    }}
                    className="w-full accent-red-500"
                  />
                  <Progress
                    value={progressVal}
                    className="h-1.5"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">ملاحظة (اختياري)</Label>
              <Input
                id="notes"
                placeholder="إضافة ملاحظة مختصرة..."
                {...register("notes")}
              />
            </div>

            {/* Workload */}
            {selectedStatus !== "available" && selectedStatus !== "break" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>نسبة الإشغال</Label>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {watch("workload") ?? 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  {...register("workload", { valueAsNumber: true })}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
