"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Building2,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateMyTaskStatusAction } from "@/app/(dashboard)/dashboard/assignments/actions";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDuration,
  formatDueDate,
  progressBarColor,
  timeAgo,
} from "@/components/assignments/card-utils";
import type { MyTask } from "@/lib/data/my-tasks";
import type { TaskPriority, TaskStatus } from "@/types/database";

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  urgent: "border-s-red-500",
  high: "border-s-orange-500",
  medium: "border-s-amber-400",
  low: "border-s-slate-300 dark:border-s-slate-600",
};

const TRANSITIONS: Record<
  TaskStatus,
  Array<{
    to: TaskStatus;
    label: string;
    icon: React.ElementType;
    variant: "primary" | "outline" | "ghost";
  }>
> = {
  pending: [
    { to: "in_progress", label: "ابدأ العمل", icon: PlayCircle, variant: "primary" },
    { to: "on_hold", label: "انتظار مراجعة", icon: PauseCircle, variant: "outline" },
  ],
  in_progress: [
    { to: "completed", label: "إنهاء المهمة", icon: CheckCircle2, variant: "primary" },
    { to: "on_hold", label: "انتظار مراجعة", icon: PauseCircle, variant: "outline" },
    { to: "pending", label: "إعادة إلى جديدة", icon: RotateCcw, variant: "ghost" },
  ],
  on_hold: [],
  completed: [],
  available: [],
  cancelled: [],
};

interface Props {
  task: MyTask;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export function MyTaskCard({ task, onStatusChange }: Props) {
  const [isPending, startTransition] = useTransition();

  const priority = PRIORITY_CONFIG[task.priority];
  const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const due = formatDueDate(task.due_date);
  const transitions = TRANSITIONS[task.status] ?? [];

  function handleTransition(newStatus: TaskStatus) {
    startTransition(async () => {
      const { error } = await updateMyTaskStatusAction(task.id, newStatus);
      if (error) {
        toast.error(error);
      } else {
        onStatusChange(task.id, newStatus);
        const labels: Record<TaskStatus, string> = {
          available: "متاحة",
          pending: "جديدة",
          in_progress: "جارية",
          on_hold: "بانتظار المراجعة",
          completed: "مكتملة",
          cancelled: "ملغاة",
        };
        toast.success(`تم تحديث حالة المهمة إلى "${labels[newStatus]}"`);
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card flex flex-col overflow-hidden",
        "transition-all duration-200 group",
        "hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.28)]",
        "hover:-translate-y-0.5",
        "border-s-[3px]",
        PRIORITY_BORDER[task.priority],
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* ── Top section ── */}
      <div className="p-4 pb-2.5 flex-1 flex flex-col gap-2.5">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border-0",
              statusConf.className
            )}
          >
            {statusConf.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border-0",
              priority.className
            )}
          >
            {priority.label}
          </span>
          {due?.urgent && (
            <span className="ms-auto flex items-center gap-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {due.text}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm leading-snug line-clamp-2 text-foreground">
          {task.title}
        </h3>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70 tabular-nums">
              {statusConf.progress}% مكتمل
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressBarColor(statusConf.progress)
              )}
              style={{ width: `${statusConf.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Meta row ── */}
      <div className="px-4 py-2 flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground border-t border-dashed border-border/50">
        {due && !due.urgent && (
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />
            {due.text}
          </span>
        )}
        {task.estimated_minutes != null && (
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formatDuration(task.estimated_minutes)}
          </span>
        )}
        {task.team && (
          <span className="flex items-center gap-1 truncate max-w-[120px]">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{task.team.name}</span>
          </span>
        )}
        <span className="ms-auto flex items-center gap-1 shrink-0 opacity-60">
          <Clock className="h-2.5 w-2.5" />
          {timeAgo(task.updated_at)}
        </span>
      </div>

      {/* ── Action buttons ── */}
      {transitions.length > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap border-t border-border/50 bg-muted/20">
          {transitions.map((tr) => {
            const Icon = tr.icon;
            return (
              <button
                key={tr.to}
                onClick={() => handleTransition(tr.to)}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-50",
                  tr.variant === "primary" &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                  tr.variant === "outline" &&
                    "border border-border text-foreground hover:bg-muted bg-background",
                  tr.variant === "ghost" &&
                    "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {tr.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div
        className={cn(
          "px-4 py-2.5 flex items-center justify-between",
          transitions.length > 0 ? "border-t border-border/50" : "border-t border-dashed border-border/50 bg-muted/10"
        )}
      >
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 min-w-0">
          <User className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate max-w-[120px]">{task.creator?.full_name ?? "—"}</span>
        </span>
        <Link
          href={`/dashboard/assignments/${task.id}`}
          className="flex items-center gap-0.5 text-[11px] font-medium text-primary hover:text-primary/80 hover:underline transition-colors shrink-0"
        >
          عرض التفاصيل
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
