"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Cog, ClipboardX, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailableTaskCard } from "./available-task-card";
import { RunningTaskCard } from "./running-task-card";
import { ReviewTaskCard } from "./review-task-card";
import { FilterBar, DEFAULT_FILTERS } from "./filter-bar";
import { CreateTaskDialog } from "./create-task-dialog";
import type { TaskWithRelations, TaskWithReviewRelations } from "@/lib/data/assignments";
import { priorityOrder } from "./card-utils";
import type { FilterState } from "./filter-bar";
import type { UserRole, Team } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "available" | "running" | "review";

interface Props {
  availableTasks: TaskWithRelations[];
  runningTasks: TaskWithRelations[];
  reviewTasks: TaskWithReviewRelations[];
  role: UserRole;
  teams: Team[];
  employeeTeamId: string | null;
  currentEmployeeId: string;
  canCreate: boolean;
  isManager: boolean;
}

// ─── Filter + sort logic ──────────────────────────────────────────────────────

function applyFilters(tasks: TaskWithRelations[], filters: FilterState): TaskWithRelations[] {
  let result = tasks;

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(q));
  }
  if (filters.priority !== "all") result = result.filter((t) => t.priority === filters.priority);
  if (filters.status !== "all") result = result.filter((t) => t.status === filters.status);

  if (filters.dueDate !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    result = result.filter((t) => {
      if (filters.dueDate === "no_due") return t.due_date == null;
      if (t.due_date == null) return false;
      const d = new Date(t.due_date);
      if (filters.dueDate === "overdue") return d < today;
      if (filters.dueDate === "today") return d >= today && d < new Date(today.getTime() + 86400000);
      if (filters.dueDate === "this_week") return d >= today && d <= weekEnd;
      return true;
    });
  }

  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "priority": return priorityOrder(a.priority) - priorityOrder(b.priority);
      case "due_date": {
        if (a.due_date == null && b.due_date == null) return 0;
        if (a.due_date == null) return 1;
        if (b.due_date == null) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
    }
  });

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentsClient({
  availableTasks,
  runningTasks,
  reviewTasks: initialReviewTasks,
  role,
  teams,
  employeeTeamId,
  currentEmployeeId,
  canCreate,
  isManager,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("available");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [reviewTasks, setReviewTasks] = useState<TaskWithReviewRelations[]>(initialReviewTasks);

  // Sync when server re-renders
  useEffect(() => { setReviewTasks(initialReviewTasks); }, [initialReviewTasks]);

  // Realtime: watch tasks + task_reviewers for review tab changes
  useEffect(() => {
    if (!employeeTeamId) return;

    const supabase = createClient();

    const taskChannel = supabase
      .channel("assignments-tasks-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `team_id=eq.${employeeTeamId}` },
        (payload) => {
          const next = payload.new as { status?: string } | null;
          const prev = payload.old as { status?: string } | null;
          if (next?.status === "on_hold" || prev?.status === "on_hold") {
            router.refresh();
          }
        }
      )
      .subscribe();

    const reviewerChannel = supabase
      .channel("assignments-reviewers-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_reviewers" },
        () => { router.refresh(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(reviewerChannel);
    };
  }, [employeeTeamId, router]);

  function handleTabChange(next: Tab) {
    setTab(next);
    setFilters((f) => ({ ...f, status: "all" }));
  }

  const filteredAvailable = useMemo(() => applyFilters(availableTasks, filters), [availableTasks, filters]);
  const filteredRunning = useMemo(() => applyFilters(runningTasks, filters), [runningTasks, filters]);

  // Show review tab if: manager always, or team members with related on_hold tasks
  const showReviewTab = isManager || reviewTasks.length > 0;

  const tabs = [
    { id: "available" as Tab, label: "الأعمال المتاحة", icon: Inbox, count: availableTasks.length, show: true },
    { id: "running" as Tab, label: "الأعمال الجارية", icon: Cog, count: runningTasks.length, show: true },
    { id: "review" as Tab, label: "بحاجة لمراجعة", icon: ClipboardCheck, count: reviewTasks.length, show: showReviewTab },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="space-y-5">
      {/* ── Tabs + Create button ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                <span className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums",
                  isActive && t.id === "review"
                    ? "bg-purple-600 text-white"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        {canCreate && (
          <CreateTaskDialog role={role} teams={teams} employeeTeamId={employeeTeamId} />
        )}
      </div>

      {/* ── Filters ── */}
      {tab !== "review" && (
        <FilterBar filters={filters} showStatusFilter={tab === "running"} onChange={setFilters} />
      )}

      {/* ── Review tab ── */}
      {tab === "review" ? (
        reviewTasks.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="لا توجد أعمال بحاجة لمراجعة"
            description="ستظهر هنا المهام التي يرسلها المنفذون للمراجعة."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {reviewTasks.map((task) => (
              <ReviewTaskCard
                key={task.id}
                task={task}
                currentEmployeeId={currentEmployeeId}
                isManager={isManager}
              />
            ))}
          </div>
        )
      ) : (
        /* ── Available / Running ── */
        (() => {
          const current = tab === "available" ? filteredAvailable : filteredRunning;
          const total = tab === "available" ? availableTasks.length : runningTasks.length;
          return current.length === 0 ? (
            <EmptyState
              icon={total === 0 ? (tab === "available" ? Inbox : Cog) : ClipboardX}
              title={total === 0 ? (tab === "available" ? "لا توجد أعمال متاحة" : "لا توجد أعمال جارية") : "لا توجد نتائج"}
              description={total === 0
                ? (tab === "available" ? "لم يُضف أحد أعمالاً متاحة لفريقك بعد." : "لا يوجد أي عمل جارٍ في فريقك حالياً.")
                : "جرّب تغيير معايير البحث أو الفلترة."}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {current.map((task) =>
                tab === "available" ? (
                  <AvailableTaskCard key={task.id} task={task} />
                ) : (
                  <RunningTaskCard key={task.id} task={task} />
                )
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
