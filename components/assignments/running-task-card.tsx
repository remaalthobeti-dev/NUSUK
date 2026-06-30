import Link from "next/link";
import { User, Users, Clock, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data/assignments";
import type { TaskStatus } from "@/types/database";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string; progress: number }
> = {
  available: { label: "متاحة", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", progress: 0 },
  pending: { label: "قيد الانتظار", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", progress: 10 },
  in_progress: { label: "جارية", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400", progress: 50 },
  on_hold: { label: "متوقفة", className: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400", progress: 25 },
  completed: { label: "مكتملة", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", progress: 100 },
  cancelled: { label: "ملغاة", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", progress: 0 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  task: TaskWithRelations;
}

export function RunningTaskCard({ task }: Props) {
  const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
            {task.title}
          </h3>
          <Badge
            className={cn(
              "shrink-0 text-xs font-medium border-0",
              statusConf.className
            )}
          >
            {statusConf.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0 flex-1">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>التقدم</span>
            <span>{statusConf.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                statusConf.progress === 100
                  ? "bg-emerald-500"
                  : statusConf.progress === 0
                    ? "bg-slate-300"
                    : "bg-blue-500"
              )}
              style={{ width: `${statusConf.progress}%` }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.assignee ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee.full_name}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Users className="h-3 w-3" />
              غير مسندة
            </span>
          )}
          <span className="flex items-center gap-1 ms-auto">
            <Clock className="h-3 w-3" />
            {timeAgo(task.updated_at)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Open button */}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/dashboard/assignments/${task.id}`}>
            فتح المهمة
            <ChevronLeft className="h-4 w-4 me-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
