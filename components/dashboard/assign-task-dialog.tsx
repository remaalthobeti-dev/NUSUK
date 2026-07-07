"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Star, Trophy, Users, Zap } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/utils";
import type { EmployeeWithPresence } from "@/types/database";
import { STATUS_CONFIG } from "./status-config";
import { assignQuickTaskAction } from "@/app/(dashboard)/dashboard/actions";

const schema = z.object({
  title: z.string().min(1, "عنوان المهمة مطلوب"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"] as const),
  estimated_hours: z.coerce.number().min(0.5).max(48),
});

type FormData = z.infer<typeof schema>;

function rankEmployees(employees: EmployeeWithPresence[]) {
  return employees
    .filter((emp) => {
      if (!emp.is_active) return false;
      const s = emp.presence?.availability_status;
      return s === "available" || s === "remote";
    })
    .sort(
      (a, b) =>
        (a.presence?.workload_percent ?? 0) -
        (b.presence?.workload_percent ?? 0)
    );
}

interface AssignTaskDialogProps {
  employees: EmployeeWithPresence[];
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTaskDialog({
  employees,
  teamId,
  open,
  onOpenChange,
}: AssignTaskDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ranked = rankEmployees(employees);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", estimated_hours: 2 },
  });

  function onSubmit(data: FormData) {
    if (!selectedEmployeeId) return;
    startTransition(async () => {
      const { error } = await assignQuickTaskAction({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        estimatedHours: data.estimated_hours,
        teamId,
        assigneeId: selectedEmployeeId,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("تم تكليف المهمة بنجاح");
        reset();
        setSelectedEmployeeId(null);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            تكليف مهمة جديدة
          </DialogTitle>
          <DialogDescription>
            يعرض النظام أفضل الموظفين المتاحين بناءً على الحالة وعبء العمل
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogBody>
            {/* Employee Recommendations */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                الموظفون المقترحون
              </Label>

              {ranked.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center flex flex-col items-center gap-2"
                  style={{ borderColor: "hsl(var(--n-gold) / .18)", background: "hsl(var(--n-gold) / .02)" }}>
                  <p className="text-sm font-medium text-muted-foreground">لا يوجد موظفون متاحون حالياً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto scrollbar-hide">
                  {ranked.map((emp, idx) => {
                    const status = emp.presence?.availability_status ?? "available";
                    const cfg = STATUS_CONFIG[status];
                    const workload = emp.presence?.workload_percent ?? 0;
                    const isSelected = selectedEmployeeId === emp.id;
                    const isTop = idx === 0;
                    const initials = emp.full_name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("");

                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border p-3 text-start transition-all duration-150",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "bg-muted/30 hover:bg-muted border-transparent",
                          isTop && !isSelected && "border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20"
                        )}
                      >
                        {isTop && (
                          <span className="absolute top-2 end-2">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}

                        <div className="relative shrink-0">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={emp.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs font-bold bg-muted">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-background",
                              cfg.dotClass
                            )}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate">
                              {emp.full_name}
                            </p>
                            {isTop && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-0 shrink-0">
                                الأفضل
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {getRoleLabel(emp.role)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap className="h-2.5 w-2.5 text-muted-foreground" />
                            <Progress
                              value={workload}
                              className="h-1 flex-1"
                              indicatorClassName={
                                workload >= 70 ? "bg-red-500" : "bg-green-500"
                              }
                            />
                            <span className="text-[9px] text-muted-foreground">
                              {workload}%
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!selectedEmployeeId && ranked.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  اختر موظفاً من القائمة أعلاه
                </p>
              )}
            </div>

            {/* Task Form */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
              <p className="text-xs font-semibold text-foreground">تفاصيل المهمة</p>

              <div className="space-y-1.5">
                <Label htmlFor="title">عنوان المهمة *</Label>
                <Input
                  id="title"
                  placeholder="مثال: مراجعة تقرير المبيعات الشهري"
                  {...register("title")}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  placeholder="وصف مفصل للمهمة..."
                  rows={2}
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الأولوية</Label>
                  <Select
                    defaultValue="medium"
                    onValueChange={(v) =>
                      setValue("priority", v as FormData["priority"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estimated_hours">المدة المقدرة (ساعات)</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    min={0.5}
                    max={48}
                    step={0.5}
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
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedEmployeeId(null);
                onOpenChange(false);
              }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedEmployeeId}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              تكليف المهمة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
