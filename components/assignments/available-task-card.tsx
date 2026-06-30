"use client";

import { useTransition } from "react";
import { Clock, AlertCircle, ChevronLeft, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { claimTaskAction } from "@/app/(dashboard)/dashboard/assignments/actions";
import type { TaskWithRelations } from "@/lib/data/assignments";
import type { TaskPriority } from "@/types/database";

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  urgent: { label: "عاجل", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  high: { label: "عالية", className: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  medium: { label: "متوسطة", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  low: { label: "منخفضة", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} د`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} س`;
}

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
  onClaimed?: () => void;
}

export function AvailableTaskCard({ task, onClaimed }: Props) {
  const [isPending, startTransition] = useTransition();
  const priority = PRIORITY_CONFIG[task.priority];

  function handleClaim() {
    startTransition(async () => {
      const { error } = await claimTaskAction(task.id);
      if (!error) onClaimed?.();
    });
  }

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

      <CardContent className="flex flex-col gap-3 pt-0 flex-1">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.estimated_minutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimated_minutes)}
            </span>
          )}
          {task.creator && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.creator.full_name}
            </span>
          )}
          <span className="flex items-center gap-1 ms-auto">
            <AlertCircle className="h-3 w-3" />
            {timeAgo(task.created_at)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Claim button */}
        <Button
          size="sm"
          className="w-full"
          onClick={handleClaim}
          disabled={isPending}
        >
          {isPending ? "جاري الاستلام…" : "استلام المهمة"}
          {!isPending && <ChevronLeft className="h-4 w-4 me-1" />}
        </Button>
      </CardContent>
    </Card>
  );
}
