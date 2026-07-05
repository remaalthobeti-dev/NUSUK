import Link from "next/link";
import {
  Clock,
  Calendar,
  User,
  Building2,
  RefreshCw,
  ChevronLeft,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data/assignments";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDuration,
  formatDueDate,
  timeAgo,
  progressBarColor,
} from "./card-utils";

interface Props {
  task: TaskWithRelations;
}

export function RunningTaskCard({ task }: Props) {
  const priority = PRIORITY_CONFIG[task.priority];
  const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const due = formatDueDate(task.due_date);

  const activeParticipants = task.participants.filter((p) => !p.left_at);
  const activeReviewer = task.reviewers?.find((r) => r.status === "reviewing");

  return (
    <Card className="flex flex-col h-full">
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
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0 flex-1">
        {/* ── Status + progress ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge className={cn("text-xs font-medium border-0", statusConf.className)}>
              {statusConf.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{statusConf.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", progressBarColor(statusConf.progress))}
              style={{ width: `${statusConf.progress}%` }}
            />
          </div>
        </div>

        {/* ── People: assignee + participants + reviewer ── */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground">
              {task.assignee?.full_name ?? (
                <span className="text-amber-600 dark:text-amber-400">غير مسندة</span>
              )}
            </span>
          </div>

          {activeParticipants.length > 0 && (
            <div className="flex flex-wrap gap-1 ps-4">
              {activeParticipants.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-muted/60 px-2 py-0.5 text-muted-foreground"
                >
                  🟢 {p.employee?.full_name ?? "—"}
                </span>
              ))}
            </div>
          )}

          {activeReviewer && (
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
              <Eye className="h-3 w-3 shrink-0" />
              <span>
                🟣 {activeReviewer.employee?.full_name ?? "—"}
                <span className="text-muted-foreground font-normal"> (مراجع)</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Meta grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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

        {/* ── Timestamps ── */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span>أُنشئت {timeAgo(task.created_at)}</span>
          <span className="flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5" />
            {timeAgo(task.updated_at)}
          </span>
        </div>

        <div className="flex-1" />

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/dashboard/assignments/${task.id}`}>
            فتح المهمة
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
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
