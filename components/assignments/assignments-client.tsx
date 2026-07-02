"use client";

import { useState, useMemo } from "react";
import { Inbox, Cog, ClipboardX } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailableTaskCard } from "./available-task-card";
import { RunningTaskCard } from "./running-task-card";
import { FilterBar, DEFAULT_FILTERS } from "./filter-bar";
import { CreateTaskDialog } from "./create-task-dialog";
import type { TaskWithRelations } from "@/lib/data/assignments";
import { priorityOrder } from "./card-utils";
import type { FilterState } from "./filter-bar";
import type { UserRole, Team } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "available" | "running";

interface Props {
  availableTasks: TaskWithRelations[];
  runningTasks: TaskWithRelations[];
  role: UserRole;
  teams: Team[];
  employeeTeamId: string | null;
  canCreate: boolean;
}

// ─── Filter + sort logic ──────────────────────────────────────────────────────

function applyFilters(
  tasks: TaskWithRelations[],
  filters: FilterState
): TaskWithRelations[] {
  let result = tasks;

  // Search
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(q));
  }

  // Priority
  if (filters.priority !== "all") {
    result = result.filter((t) => t.priority === filters.priority);
  }

  // Status
  if (filters.status !== "all") {
    result = result.filter((t) => t.status === filters.status);
  }

  // Due date
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
      if (filters.dueDate === "today") {
        return d >= today && d < new Date(today.getTime() + 86400000);
      }
      if (filters.dueDate === "this_week") return d >= today && d <= weekEnd;
      return true;
    });
  }

  // Sort
  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "priority":
        return priorityOrder(a.priority) - priorityOrder(b.priority);
      case "due_date": {
        if (a.due_date == null && b.due_date == null) return 0;
        if (a.due_date == null) return 1;
        if (b.due_date == null) return -1;
        return (
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
      }
    }
  });

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentsClient({
  availableTasks,
  runningTasks,
  role,
  teams,
  employeeTeamId,
  canCreate,
}: Props) {
  const [tab, setTab] = useState<Tab>("available");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Reset status filter when switching tabs (available tab has no status filter)
  function handleTabChange(next: Tab) {
    setTab(next);
    setFilters((f) => ({ ...f, status: "all" }));
  }

  const filteredAvailable = useMemo(
    () => applyFilters(availableTasks, filters),
    [availableTasks, filters]
  );

  const filteredRunning = useMemo(
    () => applyFilters(runningTasks, filters),
    [runningTasks, filters]
  );

  const tabs: Array<{
    id: Tab;
    label: string;
    icon: React.ElementType;
    total: number;
    filtered: number;
  }> = [
    {
      id: "available",
      label: "الأعمال المتاحة",
      icon: Inbox,
      total: availableTasks.length,
      filtered: filteredAvailable.length,
    },
    {
      id: "running",
      label: "الأعمال الجارية",
      icon: Cog,
      total: runningTasks.length,
      filtered: filteredRunning.length,
    },
  ];

  const currentTasks =
    tab === "available" ? filteredAvailable : filteredRunning;
  const totalForTab =
    tab === "available" ? availableTasks.length : runningTasks.length;

  return (
    <div className="space-y-5">
      {/* ── Tabs + Create button ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span
                className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.total}
              </span>
            </button>
          );
        })}
      </div>
        {canCreate && (
          <CreateTaskDialog
            role={role}
            teams={teams}
            employeeTeamId={employeeTeamId}
          />
        )}
      </div>

      {/* ── Filters ── */}
      <FilterBar
        filters={filters}
        showStatusFilter={tab === "running"}
        onChange={setFilters}
      />

      {/* ── Content ── */}
      {currentTasks.length === 0 ? (
        <EmptyState
          icon={totalForTab === 0 ? (tab === "available" ? Inbox : Cog) : ClipboardX}
          title={
            totalForTab === 0
              ? tab === "available"
                ? "لا توجد أعمال متاحة"
                : "لا توجد أعمال جارية"
              : "لا توجد نتائج"
          }
          description={
            totalForTab === 0
              ? tab === "available"
                ? "لم يُضف أحد أعمالاً متاحة لفريقك بعد."
                : "لا يوجد أي عمل جارٍ في فريقك حالياً."
              : "جرّب تغيير معايير البحث أو الفلترة."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentTasks.map((task) =>
            tab === "available" ? (
              <AvailableTaskCard key={task.id} task={task} />
            ) : (
              <RunningTaskCard key={task.id} task={task} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
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
