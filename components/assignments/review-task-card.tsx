"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  RotateCcw,
  Calendar,
  RefreshCw,
  ChevronLeft,
  AlertTriangle,
  Eye,
  Clock,
  ArrowRight,
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
  startReviewAction,
} from "@/app/(dashboard)/dashboard/assignments/actions";
import type { TaskWithReviewRelations } from "@/lib/data/assignments";
import { PRIORITY_CONFIG, timeAgo, formatDueDate, progressBarColor } from "./card-utils";
import Link from "next/link";

interface Props {
  task: TaskWithReviewRelations;
  currentEmployeeId: string;
  isManager: boolean;
}

// ─── Execution chain ──────────────────────────────────────────────────────────

function ExecutionChain({
  task,
  currentEmployeeId,
}: {
  task: TaskWithReviewRelations;
  currentEmployeeId: string;
}) {
  const activeParticipants = task.participants.filter((p) => !p.left_at);
  const activeReviewer = task.reviewers.find((r) => r.status === "reviewing");
  const progress = 80;

  return (
    <div className="rounded-lg border border-muted/60 bg-muted/20 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-muted/60 bg-muted/40">
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
        <span className="text-xs font-semibold text-muted-foreground ">
          سلسلة التنفيذ
        </span>
      </div>

      <div className="divide-y divide-muted/40">
        {/* Assignee */}
        <ChainRow icon="👤" label="المستلم الرئيسي">
          <span className="font-medium text-foreground">
            {task.assignee?.full_name ?? "—"}
            {task.assigned_to === currentEmployeeId && (
              <span className="ms-1 text-muted-foreground font-normal">(أنت)</span>
            )}
          </span>
        </ChainRow>

        {/* Participants */}
        <ChainRow icon="🤝" label="المشاركون">
          {activeParticipants.length === 0 ? (
            <span className="text-muted-foreground">لا يوجد</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {activeParticipants.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 text-[10px]"
                >
                  {p.employee?.full_name ?? "—"}
                  {p.employee?.id === currentEmployeeId && " (أنت)"}
                </span>
              ))}
            </span>
          )}
        </ChainRow>

        {/* Reviewer */}
        <ChainRow icon="🔍" label="المراجع الحالي">
          {activeReviewer ? (
            <span className="flex items-center gap-1 flex-wrap">
              <span className="font-medium text-purple-700 dark:text-purple-400">
                {activeReviewer.employee?.full_name ?? "—"}
                {activeReviewer.employee?.id === currentEmployeeId && " (أنت)"}
              </span>
              <Badge className="text-[10px] border-0 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 py-0 h-4">
                قيد المراجعة
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> لم يتم تعيين مراجع بعد
            </span>
          )}
        </ChainRow>

        {/* Status */}
        <ChainRow icon="📊" label="الحالة">
          <Badge className="text-[10px] border-0 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 h-4 py-0">
            بانتظار المراجعة
          </Badge>
        </ChainRow>

        {/* Progress */}
        <ChainRow icon="📈" label="نسبة الإنجاز">
          <span className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full", progressBarColor(progress))}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-medium tabular-nums text-foreground">{progress}%</span>
          </span>
        </ChainRow>
      </div>
    </div>
  );
}

function ChainRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 text-xs">
      <span className="text-sm w-5 shrink-0 mt-0.5">{icon}</span>
      <span className="text-muted-foreground shrink-0 w-[84px]">{label}:</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function ReviewTaskCard({ task, currentEmployeeId, isManager }: Props) {
  const router = useRouter();
  const [isPendingApprove, startApprove] = useTransition();
  const [isPendingReturn, startReturn] = useTransition();
  const [isPendingStart, startReview] = useTransition();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const priority = PRIORITY_CONFIG[task.priority];
  const due = formatDueDate(task.due_date);
  const activeReviewer = task.reviewers.find((r) => r.status === "reviewing");
  const pastReviewers = task.reviewers.filter((r) => r.status !== "reviewing");

  const isAssignee = task.assigned_to === currentEmployeeId;
  const isActiveReviewer = activeReviewer?.employee?.id === currentEmployeeId;
  const canReview = !isAssignee && !activeReviewer;
  const canApproveReturn = isActiveReviewer || (isManager && !activeReviewer);
  const isAnyPending = isPendingApprove || isPendingReturn || isPendingStart;

  function handleStartReview() {
    startReview(async () => {
      const result = await startReviewAction(task.id);
      if (result.error) toast.error(result.error);
      else { toast.success("بدأت مراجعة المهمة"); router.refresh(); }
    });
  }

  function handleApprove() {
    startApprove(async () => {
      const result = await approveTaskAction(task.id);
      if (result.error) toast.error(result.error);
      else { toast.success("تم اعتماد المهمة وإغلاقها"); router.refresh(); }
    });
  }

  function handleReturn() {
    if (!returnReason.trim()) { toast.error("يرجى كتابة سبب الإرجاع"); return; }
    startReturn(async () => {
      const result = await returnTaskAction(task.id, returnReason.trim());
      if (result.error) toast.error(result.error);
      else {
        toast.success("تمت إعادة المهمة للتنفيذ");
        setShowReturnForm(false);
        setReturnReason("");
        router.refresh();
      }
    });
  }

  return (
    <Card className="flex flex-col h-full border-purple-200/60 dark:border-purple-800/40">
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
        {/* ── Execution chain ── */}
        <ExecutionChain task={task} currentEmployeeId={currentEmployeeId} />

        {/* ── Past review history ── */}
        {pastReviewers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">سجل المراجعة السابق:</p>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {pastReviewers.slice(0, 2).map((r) => (
                <p key={r.id} className="flex items-start gap-1 flex-wrap">
                  <span>{r.status === "approved" ? "✅" : "↩️"}</span>
                  <span className="font-medium text-foreground">{r.employee?.full_name ?? "—"}</span>
                  <span className="text-muted-foreground/70">
                    ({r.status === "approved" ? "اعتمد" : "أرجع"} {timeAgo(r.completed_at ?? r.started_at)})
                  </span>
                  {r.notes && (
                    <span className="italic text-muted-foreground/60 w-full ps-4 truncate">
                      السبب: {r.notes}
                    </span>
                  )}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── Meta ── */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {due && (
            <span className={cn("flex items-center gap-1", due.urgent && "text-red-600 dark:text-red-400 font-medium")}>
              {due.urgent ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {due.text}
            </span>
          )}
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
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
              className="min-h-[72px] text-sm resize-none"
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
              <Button size="sm" variant="ghost" className="text-xs"
                onClick={() => { setShowReturnForm(false); setReturnReason(""); }}
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
            {canReview && (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/20"
                onClick={handleStartReview}
                disabled={isAnyPending}
              >
                {isPendingStart ? "جاري البدء…" : (
                  <><Eye className="h-4 w-4 me-1" /> بدء المراجعة</>
                )}
              </Button>
            )}

            {canApproveReturn && (
              <>
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleApprove}
                  disabled={isAnyPending}
                >
                  {isPendingApprove ? "جاري الاعتماد…" : (
                    <><CheckCircle2 className="h-4 w-4 me-1" /> اعتماد المهمة</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/20"
                  onClick={() => setShowReturnForm(true)}
                  disabled={isAnyPending}
                >
                  <RotateCcw className="h-4 w-4 me-1" /> إعادة للتنفيذ
                </Button>
              </>
            )}

            {activeReviewer && !isActiveReviewer && !isManager && (
              <p className="text-xs text-center text-purple-700 dark:text-purple-400 py-1.5 bg-purple-50 dark:bg-purple-950/20 rounded-md">
                🟣 قيد المراجعة من قِبل {activeReviewer.employee?.full_name ?? "موظف آخر"}
              </p>
            )}

            <Button asChild variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
              <Link href={`/dashboard/assignments/${task.id}`}>
                فتح التفاصيل <ChevronLeft className="h-3.5 w-3.5 me-1 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
