"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageSquare,
  PlusCircle,
  TimerIcon,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CountdownTimer } from "./countdown-timer";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { EmployeeWithPresence, ActivityLog } from "@/types/database";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  calcProgress,
  formatTimeAgo,
} from "./status-config";
import { getRoleLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ACTION_ICONS: Record<string, string> = {
  status_changed: "🔄",
  started_task: "▶️",
  completed_task: "✅",
  task_assigned: "📋",
  added_note: "📝",
  created: "🆕",
};

const ACTION_LABELS: Record<string, string> = {
  status_changed: "تغيير الحالة",
  started_task: "بدء مهمة",
  completed_task: "إنهاء مهمة",
  task_assigned: "تكليف بمهمة",
  added_note: "ملاحظة",
  created: "إنشاء",
};

interface EmployeeDrawerProps {
  employee: EmployeeWithPresence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: () => void;
}

export function EmployeeDrawer({
  employee,
  open,
  onOpenChange,
  onUpdateStatus,
}: EmployeeDrawerProps) {
  const [notes, setNotes] = useState("");
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Reset notes when employee changes
  useEffect(() => {
    setNotes(employee?.presence?.notes ?? "");
  }, [employee]);

  // Fetch timeline when drawer opens
  useEffect(() => {
    if (!open || !employee) return;

    async function fetchTimeline() {
      if (!employee) return;
      setLoadingTimeline(true);
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("actor_id", employee.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      setTimeline((data as ActivityLog[]) ?? []);
      setLoadingTimeline(false);
    }

    fetchTimeline();
  }, [open, employee]);

  if (!employee) return null;

  const status = employee.presence?.availability_status ?? "available";
  const cfg = STATUS_CONFIG[status];
  const task = employee.current_task;
  const workload = employee.presence?.workload_percent ?? 0;
  const progress = calcProgress(task?.started_at ?? null, task?.due_date ?? null);

  const initials = employee.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  const workloadColor =
    workload >= 80
      ? "bg-red-500"
      : workload >= 50
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[480px] p-0">
        {/* ── Header ─────────────────────────────── */}
        <SheetHeader className="relative border-b bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
          <SheetClose className="absolute top-4 start-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
          </SheetClose>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative">
              <Avatar className={cn("h-16 w-16 ring-2 ring-offset-2", cfg.ringClass)}>
                <AvatarImage src={employee.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg font-bold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-0 end-0 w-4 h-4 rounded-full border-2 border-background",
                  cfg.dotClass,
                  status === "available" && "animate-pulse"
                )}
              />
            </div>

            <div className="flex-1">
              <SheetTitle className="text-xl">{employee.full_name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getRoleLabel(employee.role)}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border",
                  cfg.badgeClass
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full me-1.5",
                    cfg.dotClass,
                    status === "available" && "animate-pulse"
                  )}
                />
                {cfg.label}
              </span>
            </div>
          </div>

          {employee.presence?.notes && (
            <p className="text-xs text-muted-foreground mt-3 bg-background/50 rounded-lg px-3 py-2 border italic">
              &ldquo;{employee.presence.notes}&rdquo;
            </p>
          )}
        </SheetHeader>

        {/* ── Body ───────────────────────────────── */}
        <SheetBody className="space-y-5 pt-5">

          {/* Current Task */}
          <Section icon={<ClipboardList className="h-4 w-4" />} title="المهمة الحالية">
            {task ? (
              <div className="rounded-xl border bg-muted/30 dark:bg-slate-800/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground leading-snug">
                    {task.title}
                  </p>
                  <Badge
                    className={cn(
                      "text-[10px] px-2 shrink-0 border-0",
                      PRIORITY_CONFIG[task.priority].badgeClass
                    )}
                  >
                    {PRIORITY_CONFIG[task.priority].label}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {task.started_at && (
                    <InfoItem
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="بدأت في"
                      value={formatDateTime(task.started_at)}
                    />
                  )}
                  {task.due_date && (
                    <InfoItem
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="ينتهي في"
                      value={formatDateTime(task.due_date)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <EmptyState label="لا توجد مهمة نشطة حالياً" />
            )}
          </Section>

          {/* Countdown */}
          {task?.due_date && (
            <Section
              icon={<TimerIcon className="h-4 w-4" />}
              title="الوقت المتبقي"
            >
              <div className="rounded-xl border bg-muted/30 dark:bg-slate-800/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">العد التنازلي</span>
                  <CountdownTimer dueDate={task.due_date} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">إنجاز المهمة (بالوقت)</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2"
                    indicatorClassName={cn(
                      progress >= 90 ? "bg-red-500" :
                      progress >= 70 ? "bg-amber-500" : "bg-blue-500"
                    )}
                  />
                </div>
              </div>
            </Section>
          )}

          {/* Workload */}
          <Section icon={<Zap className="h-4 w-4" />} title="عبء العمل">
            <div className="rounded-xl border bg-muted/30 dark:bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">نسبة الإشغال</span>
                <span
                  className={cn(
                    "font-bold text-lg",
                    workload >= 80
                      ? "text-red-600 dark:text-red-400"
                      : workload >= 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                  )}
                >
                  {workload}%
                </span>
              </div>
              <Progress
                value={workload}
                className="h-3"
                indicatorClassName={cn("transition-all duration-700", workloadColor)}
              />
            </div>
          </Section>

          {/* Actions */}
          <Section icon={<PlusCircle className="h-4 w-4" />} title="إجراءات">
            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                variant={status === "available" ? "default" : "outline"}
                disabled={status === "busy" || status === "meeting"}
              >
                <CheckCircle2 className="h-4 w-4" />
                قبول مهمة جديدة
              </Button>
              {onUpdateStatus && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onUpdateStatus();
                  }}
                >
                  <User className="h-4 w-4" />
                  تحديث الحالة
                </Button>
              )}
              {(status === "busy" || status === "meeting") && (
                <p className="text-xs text-muted-foreground text-center">
                  الموظف غير متاح حالياً
                </p>
              )}
            </div>
          </Section>

          {/* Notes */}
          <Section icon={<MessageSquare className="h-4 w-4" />} title="ملاحظات">
            <textarea
              className={cn(
                "w-full resize-none rounded-xl border bg-muted/30 dark:bg-slate-800/40 p-3",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "min-h-[80px] transition-colors"
              )}
              placeholder="أضف ملاحظة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Section>

          {/* Today's Timeline */}
          <Section icon={<Clock className="h-4 w-4" />} title="نشاط اليوم">
            {loadingTimeline ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : timeline.length > 0 ? (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute start-[18px] top-0 bottom-0 w-px bg-border" />
                <ol className="space-y-3">
                  {timeline.map((entry) => (
                    <TimelineEntry key={entry.id} entry={entry} />
                  ))}
                </ol>
              </div>
            ) : (
              <EmptyState label="لا يوجد نشاط مسجل اليوم" />
            )}
          </Section>

          <div className="h-4" />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/* ──── Sub-components ──────────────────────── */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function TimelineEntry({ entry }: { entry: ActivityLog }) {
  const icon = ACTION_ICONS[entry.action] ?? "•";
  const label = ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, " ");
  const vals = entry.new_values as Record<string, string> | null;
  const detail = vals?.task ?? vals?.status ?? vals?.note ?? null;

  const time = new Date(entry.created_at).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Status color for the dot
  const statusColor = vals?.status
    ? STATUS_CONFIG[vals.status as keyof typeof STATUS_CONFIG]?.dotClass ?? "bg-muted-foreground"
    : "bg-primary";

  return (
    <li className="relative flex gap-3 ps-10">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute start-3 top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-[8px] z-10",
          statusColor
        )}
      >
        <span className="sr-only">{label}</span>
      </div>

      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{icon}</span>
              <p className="text-xs font-medium text-foreground">{label}</p>
            </div>
            {detail && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {detail}
              </p>
            )}
          </div>
          <time className="text-[10px] text-muted-foreground shrink-0 font-mono">
            {time}
          </time>
        </div>
      </div>
    </li>
  );
}
