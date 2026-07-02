"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  RotateCcw,
  User,
  Users,
  Calendar,
  RefreshCw,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  approveTaskAction,
  returnTaskAction,
} from "@/app/(dashboard)/dashboard/assignments/actions";
import type { TaskWithReviewRelations } from "@/lib/data/assignments";
import { PRIORITY_CONFIG, timeAgo, formatDueDate, progressBarColor } from "./card-utils";
import Link from "next/link";

interface Props {
  task: TaskWithReviewRelations;
}

export function ReviewTaskCard({ task }: Props) {
  const router = useRouter();
  const [isPendingApprove, startApprove] = useTransition();
  const [isPendingReturn, startReturn] = useTransition();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const priority = PRIORITY_CONFIG[task.priority];
  const due = formatDueDate(task.due_date);
  const progress = 80;

  const activeParticipants = task.participants.filter((p) => !p.left_at);

  function handleApprove() {
    startApprove(async () => {
      const result = await approveTaskAction(task.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم اعتماد المهمة وإغلاقها");
        router.refresh();
      }
    });
  }

  function handleReturn() {
    if (!returnReason.trim()) {
      toast.error("يرجى كتابة سبب الإرجاع");
      return;
    }
    startReturn(async () => {
      const result = await returnTaskAction(task.id, returnReason.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تمت إعادة المهمة للتنفيذ");
        setShowReturnForm(false);
        setReturnReason("");
        router.refresh();
      }
    });
  }

  const isAnyPending = isPendingApprove || isPendingReturn;

  return (
    <Card className="flex flex-col h-full border-purple-200/60 dark:border-purple-800/40">
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
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0 flex-1">
        {/* ── Progress ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge className="text-xs font-medium border-0 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
              بانتظار المراجعة
            </Badge>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressBarColor(progress)
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Assignee + participants ── */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">
              {task.assignee?.full_name ?? (
                <span className="text-amber-600 dark:text-amber-400">
                  غير مسندة
                </span>
              )}
            </span>
          </span>

          {activeParticipants.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {activeParticipants.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
                  >
                    {p.employee?.full_name ?? "—"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Meta row ── */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {due && (
            <span
              className={cn(
                "flex items-center gap-1",
                due.urgent && "text-red-600 dark:text-red-400 font-medium"
              )}
            >
              {due.urgent ? (
                <AlertTriangle className="h-3 w-3 shrink-0" />
              ) : (
                <Calendar className="h-3 w-3 shrink-0" />
              )}
              {due.text}
            </span>
          )}
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3 shrink-0" />
            {timeAgo(task.updated_at)}
          </span>
        </div>

        {/* ── Return reason form ── */}
        {showReturnForm && (
          <div className="space-y-2 rounded-lg border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/10 p-3">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
              سبب الإرجاع (مطلوب)
            </p>
            <Textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="اكتب سبب إرجاع المهمة…"
              className="min-h-[80px] text-sm resize-none"
              disabled={isPendingReturn}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 text-xs"
                onClick={handleReturn}
                disabled={isPendingReturn || !returnReason.trim()}
              >
                {isPendingReturn ? "جاري الإرجاع…" : "تأكيد الإرجاع"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setShowReturnForm(false);
                  setReturnReason("");
                }}
                disabled={isPendingReturn}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* ── Action buttons ── */}
        {!showReturnForm && (
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApprove}
              disabled={isAnyPending}
            >
              {isPendingApprove ? (
                "جاري الاعتماد…"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ms-1" />
                  اعتماد المهمة
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/20"
              onClick={() => setShowReturnForm(true)}
              disabled={isAnyPending}
            >
              <RotateCcw className="h-4 w-4 ms-1" />
              إعادة للتنفيذ
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
              <Link href={`/dashboard/assignments/${task.id}`}>
                فتح المهمة
                <ChevronLeft className="h-3.5 w-3.5 me-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
