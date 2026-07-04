"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Building2,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { TaskStatus } from "@/types/database";

// Allowed transitions and their labels/icons
const TRANSITIONS: Record<
  TaskStatus,
  Array<{ to: TaskStatus; label: string; icon: React.ElementType; variant: "default" | "outline" | "secondary" }>
> = {
  pending: [
    { to: "in_progress", label: "ابدأ العمل", icon: PlayCircle, variant: "default" },
    { to: "on_hold", label: "انتظار مراجعة", icon: PauseCircle, variant: "outline" },
  ],
  in_progress: [
    { to: "completed", label: "إنهاء المهمة", icon: CheckCircle2, variant: "default" },
    { to: "on_hold", label: "انتظار مراجعة", icon: PauseCircle, variant: "outline" },
    { to: "pending", label: "إعادة إلى جديدة", icon: RotateCcw, variant: "secondary" },
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
    <Card className={cn("flex flex-col h-full transition-all", isPending && "opacity-60 pointer-events-none")}>
      {/* ── Header ── */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
            {task.title}
          </h3>
          <Badge className={cn("shrink-0 text-xs font-medium border-0", priority.className)}>
            {priority.label}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {task.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0 flex-1">
        {/* ── Progress ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge className={cn("text-xs font-medium border-0", statusConf.className)}>
              {statusConf.label}
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              {statusConf.progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", progressBarColor(statusConf.progress))}
              style={{ width: `${statusConf.progress}%` }}
            />
          </div>
        </div>

        {/* ── Meta grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <MetaItem
            icon={Calendar}
            text={due ? due.text : "لا يوجد موعد"}
            urgent={due?.urgent}
          />
          <MetaItem
            icon={Clock}
            text={task.estimated_minutes != null ? formatDuration(task.estimated_minutes) : "غير محدد"}
          />
          <MetaItem icon={Building2} text={task.team?.name ?? "—"} />
          <MetaItem icon={User} text={task.creator?.full_name ?? "—"} />
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          آخر تحديث {timeAgo(task.updated_at)}
        </p>

        <div className="flex-1" />

        {/* ── Status actions ── */}
        {transitions.length > 0 && (
          <div className="flex flex-col gap-2">
            {transitions.map((tr) => {
              const Icon = tr.icon;
              return (
                <Button
                  key={tr.to}
                  size="sm"
                  variant={tr.variant}
                  className="w-full gap-2"
                  onClick={() => handleTransition(tr.to)}
                  disabled={isPending}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tr.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* ── View details ── */}
        <Button asChild variant="ghost" size="sm" className="w-full gap-1 text-muted-foreground">
          <Link href={`/dashboard/assignments/${task.id}`}>
            عرض التفاصيل
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MetaItem({
  icon: Icon,
  text,
  urgent,
}: {
  icon: React.ElementType;
  text: string;
  urgent?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-1 min-w-0", urgent && "text-red-600 dark:text-red-400 font-medium")}>
      {urgent ? (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      ) : (
        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{text}</span>
    </span>
  );
}
