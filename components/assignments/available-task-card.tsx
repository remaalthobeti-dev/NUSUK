"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  User,
  Building2,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { claimTaskAction } from "@/app/(dashboard)/dashboard/assignments/actions";
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

export function AvailableTaskCard({ task }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const due = formatDueDate(task.due_date);

  function handleClaim() {
    startTransition(async () => {
      const result = await claimTaskAction(task.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم استلام المهمة بنجاح");
        router.refresh();
      }
    });
  }

  return (
    <Card className="flex flex-col h-full">
      {/* ── Header ── */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
            {task.title}
          </h3>
          <Badge
            className={cn(
              "shrink-0 text-xs font-medium border-0",
              priority.className
            )}
          >
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
        {/* ── Status + progress ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                "text-xs font-medium border-0",
                status.className
              )}
            >
              {status.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {status.progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full", progressBarColor(status.progress))}
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>

        {/* ── Meta grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {/* Due date */}
          <MetaItem
            icon={Calendar}
            text={due ? due.text : "لا يوجد موعد"}
            urgent={due?.urgent}
          />

          {/* Estimated duration */}
          <MetaItem
            icon={Clock}
            text={
              task.estimated_minutes != null
                ? formatDuration(task.estimated_minutes)
                : "غير محدد"
            }
          />

          {/* Team */}
          <MetaItem
            icon={Building2}
            text={task.team?.name ?? "—"}
          />

          {/* Created by */}
          <MetaItem
            icon={User}
            text={task.creator?.full_name ?? "—"}
          />
        </div>

        {/* Created time — full width */}
        <p className="text-[11px] text-muted-foreground/70">
          أُنشئت {timeAgo(task.created_at)}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Claim button ── */}
        <Button
          size="sm"
          className="w-full"
          onClick={handleClaim}
          disabled={isPending}
        >
          {isPending ? (
            "جاري الاستلام…"
          ) : (
            <>
              استلام المهمة
              <ChevronLeft className="h-4 w-4 me-1" />
            </>
          )}
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
    <span
      className={cn(
        "flex items-center gap-1 min-w-0",
        urgent && "text-red-600 dark:text-red-400 font-medium"
      )}
    >
      {urgent ? (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      ) : (
        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{text}</span>
    </span>
  );
}
