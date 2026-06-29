import { Briefcase, Clock, Edit2, Eye, RefreshCw, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatStatusDuration } from "@/lib/utils";
import type { EmployeeWithPresence } from "@/types/database";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatRemaining,
  formatTimeAgo,
} from "./status-config";
import { getRoleLabel } from "@/lib/utils";

interface EmployeeCardProps {
  employee: EmployeeWithPresence;
  onClick: () => void;
  onUpdateStatus: () => void;
}

export function EmployeeCard({
  employee,
  onClick,
  onUpdateStatus,
}: EmployeeCardProps) {
  const status = employee.presence?.availability_status ?? "available";
  const cfg = STATUS_CONFIG[status];
  const workload = employee.presence?.workload_percent ?? 0;
  const task = employee.current_task;
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
    <div
      className={cn(
        "group relative rounded-2xl border transition-all duration-200",
        "bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm",
        "hover:shadow-lg hover:-translate-y-0.5",
        `border-s-4 ${cfg.borderClass}`
      )}
    >
      {/* Main clickable area → opens drawer */}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-start p-5 pb-3 focus:outline-none"
      >
        {/* Header: avatar + name + status badge */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <Avatar
              className={cn(
                "h-12 w-12 ring-2 ring-offset-2",
                cfg.ringClass
              )}
            >
              <AvatarImage src={employee.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 end-0 w-3.5 h-3.5 rounded-full border-2 border-background",
                cfg.dotClass,
                status === "available" && "animate-pulse"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {employee.full_name}
            </p>
            {employee.job_title ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                <Briefcase className="h-2.5 w-2.5 shrink-0" />
                {employee.job_title}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                {getRoleLabel(employee.role)}
              </p>
            )}
          </div>

          <span
            className={cn(
              "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border",
              cfg.badgeClass
            )}
          >
            {cfg.label}
          </span>
        </div>

        {/* Current Task */}
        <div className="rounded-lg bg-muted/50 dark:bg-slate-800/50 px-3 py-2 mb-3 min-h-[48px] flex flex-col justify-center">
          {task ? (
            <>
              <p className="text-xs font-medium text-foreground truncate">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 border-0",
                    PRIORITY_CONFIG[task.priority].badgeClass
                  )}
                >
                  {PRIORITY_CONFIG[task.priority].label}
                </Badge>
                {task.due_date && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRemaining(task.due_date)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">لا توجد مهمة نشطة</p>
          )}
        </div>

        {/* Workload */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              عبء العمل
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
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
            className="h-1.5"
            indicatorClassName={cn("transition-all duration-700", workloadColor)}
          />
        </div>

        {/* Status duration */}
        {employee.presence && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {formatStatusDuration(employee.presence.started_at || employee.presence.updated_at)}
            </span>
          </div>
        )}
      </button>

      {/* Action buttons row */}
      <div className="flex items-center gap-1.5 px-5 pb-4 pt-1">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          عرض التفاصيل
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStatus();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
            "text-primary hover:bg-primary/10"
          )}
        >
          <Edit2 className="h-3.5 w-3.5" />
          تحديث الحالة
        </button>
      </div>
    </div>
  );
}
