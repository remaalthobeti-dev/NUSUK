"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Users, MessageSquare, Activity, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/components/assignments/card-utils";
import type { TaskDetailData } from "@/lib/data/task-detail";
import { OverviewTab } from "./overview-tab";
import { ParticipantsTab } from "./participants-tab";
import { CommentsTab } from "./comments-tab";
import { ActivityTab } from "./activity-tab";
import { RequestDialog } from "./request-dialog";
import { createClient } from "@/lib/supabase/client";

type Tab = "overview" | "participants" | "comments" | "activity";

interface Props {
  data: TaskDetailData;
}

export function TaskDetailClient({ data }: Props) {
  const router = useRouter();
  const {
    task, participants, comments, activity, pendingRequests,
    reviewers, teamMembers, currentEmployeeId, currentEmployeeRole,
  } = data;

  const [tab, setTab] = useState<Tab>("overview");
  const [requestDialogType, setRequestDialogType] = useState<"collaboration" | "review" | null>(null);

  const priority = PRIORITY_CONFIG[task.priority];
  const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;

  const isActive = !["completed", "cancelled"].includes(task.status);
  const activeParticipants = participants.filter((p) => !p.left_at);
  const myPendingRequests = pendingRequests.filter((r) => r.requestee?.id === currentEmployeeId);

  // Realtime: refresh on any change to this task's related tables
  useEffect(() => {
    const supabase = createClient();
    const taskId = task.id;

    const channel = supabase
      .channel(`task-detail:${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `id=eq.${taskId}` },
        () => { router.refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_participants", filter: `task_id=eq.${taskId}` },
        () => { router.refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_reviewers", filter: `task_id=eq.${taskId}` },
        () => { router.refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => { router.refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_activity", filter: `task_id=eq.${taskId}` },
        () => { router.refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_requests", filter: `task_id=eq.${taskId}` },
        () => { router.refresh(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [task.id, router]);

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: "overview", label: "نظرة عامة", icon: Eye },
    {
      id: "participants",
      label: "الفريق",
      icon: Users,
      badge: activeParticipants.length + reviewers.length + pendingRequests.length,
    },
    { id: "comments", label: "التعليقات", icon: MessageSquare, badge: comments.length },
    { id: "activity", label: "السجل", icon: Activity, badge: activity.length },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Back link ── */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground -ms-2">
          <Link href="/dashboard/assignments">
            <ChevronRight className="h-4 w-4" />
            الأعمال الجارية
          </Link>
        </Button>
      </div>

      {/* ── Task header ── */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-xl font-bold flex-1 min-w-0">{task.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("border-0 text-xs font-medium", priority.className)}>
              {priority.label}
            </Badge>
            <Badge className={cn("border-0 text-xs font-medium", statusConf.className)}>
              {statusConf.label}
            </Badge>
          </div>
        </div>

        {/* ── Action buttons ── */}
        {isActive && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setRequestDialogType("collaboration")}>
              <Users className="h-4 w-4 me-1.5" />
              طلب مشاركة
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRequestDialogType("review")}>
              <Eye className="h-4 w-4 me-1.5" />
              طلب مراجعة
            </Button>
          </div>
        )}

        {/* ── Incoming request notice ── */}
        {myPendingRequests.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            لديك {myPendingRequests.length === 1 ? "طلب" : `${myPendingRequests.length} طلبات`} بانتظار ردك —
            <button className="underline ms-1 font-medium" onClick={() => setTab("participants")}>
              انظر الفريق
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActiveTab = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                isActiveTab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums",
                  isActiveTab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div>
        {tab === "overview" && <OverviewTab task={task} />}
        {tab === "participants" && (
          <ParticipantsTab
            taskId={task.id}
            participants={activeParticipants}
            pendingRequests={pendingRequests}
            reviewers={reviewers}
            currentEmployeeId={currentEmployeeId}
            currentEmployeeRole={currentEmployeeRole}
            assigneeId={task.assigned_to}
          />
        )}
        {tab === "comments" && (
          <CommentsTab taskId={task.id} comments={comments} currentEmployeeId={currentEmployeeId} />
        )}
        {tab === "activity" && <ActivityTab entries={activity} />}
      </div>

      {/* ── Request dialog ── */}
      {requestDialogType && (
        <RequestDialog
          taskId={task.id}
          requestType={requestDialogType}
          teamMembers={teamMembers}
          existingParticipantIds={[
            ...(task.assigned_to ? [task.assigned_to] : []),
            ...activeParticipants.map((p) => p.employee_id),
          ]}
          currentEmployeeId={currentEmployeeId}
          onClose={() => setRequestDialogType(null)}
        />
      )}
    </div>
  );
}
