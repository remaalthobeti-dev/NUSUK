"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ListTodo,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Search,
  ClipboardX,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MyTaskCard } from "./my-task-card";
import type { MyTask } from "@/lib/data/my-tasks";
import type { TaskPriority, TaskStatus } from "@/types/database";
import { formatDueDate } from "@/components/assignments/card-utils";

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = "pending" | "in_progress" | "on_hold" | "completed";

const TABS: Array<{
  id: TabId;
  label: string;
  icon: React.ElementType;
  status: TaskStatus;
}> = [
  { id: "pending", label: "جديدة", icon: ListTodo, status: "pending" },
  { id: "in_progress", label: "قيد التنفيذ", icon: PlayCircle, status: "in_progress" },
  { id: "on_hold", label: "بانتظار المراجعة", icon: PauseCircle, status: "on_hold" },
  { id: "completed", label: "مكتملة", icon: CheckCircle2, status: "completed" },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | "all"; label: string }> = [
  { value: "all", label: "كل الأولويات" },
  { value: "urgent", label: "عاجل" },
  { value: "high", label: "عالية" },
  { value: "medium", label: "متوسطة" },
  { value: "low", label: "منخفضة" },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeStats(tasks: MyTask[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

  return {
    total: tasks.length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    overdue: tasks.filter((t) => {
      if (!t.due_date || t.status === "completed") return false;
      return formatDueDate(t.due_date)?.urgent ?? false;
    }).length,
    completedToday: tasks.filter((t) => {
      if (t.status !== "completed" || !t.completed_at) return false;
      return new Date(t.completed_at).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) === todayStr;
    }).length,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialTasks: MyTask[];
  employeeId: string;
}

export function MyTasksClient({ initialTasks, employeeId }: Props) {
  const [tasks, setTasks] = useState<MyTask[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<TabId>("in_progress");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`my-tasks:${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${employeeId}`,
        },
        (payload) => {
          const updated = payload.new as MyTask;
          setTasks((prev) => {
            const exists = prev.find((t) => t.id === updated.id);
            if (exists) {
              return prev.map((t) =>
                t.id === updated.id ? { ...t, ...updated } : t
              );
            }
            // New task assigned to me
            return [updated, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${employeeId}`,
        },
        (payload) => {
          const inserted = payload.new as MyTask;
          setTasks((prev) => [inserted, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId]);

  // ── Handle optimistic status update from card ──────────────────────────────
  function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              updated_at: new Date().toISOString(),
              completed_at:
                newStatus === "completed" ? new Date().toISOString() : t.completed_at,
            }
          : t
      )
    );
  }

  // ── Filtered + sorted task list for active tab ─────────────────────────────
  const tabStatus = TABS.find((t) => t.id === activeTab)?.status ?? "in_progress";

  const filtered = useMemo(() => {
    let result = tasks.filter((t) => t.status === tabStatus);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [tasks, tabStatus, search, priorityFilter]);

  const stats = useMemo(() => computeStats(tasks), [tasks]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.id,
          tasks.filter((t) => t.status === tab.status).length,
        ])
      ) as Record<TabId, number>,
    [tasks]
  );

  return (
    <div className="space-y-6">
      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="إجمالي مهامي"
          value={stats.total}
          color="text-foreground"
          bg="bg-muted/50"
        />
        <StatCard
          label="قيد التنفيذ"
          value={stats.in_progress}
          color="text-blue-700 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard
          label="مكتملة اليوم"
          value={stats.completedToday}
          color="text-emerald-700 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/20"
        />
        <StatCard
          label="متأخرة"
          value={stats.overdue}
          color="text-red-700 dark:text-red-400"
          bg="bg-red-50 dark:bg-red-950/20"
          icon={stats.overdue > 0 ? AlertTriangle : undefined}
        />
      </div>

      {/* ── Tabs + Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 flex-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
                <span
                  className={cn(
                    "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search + Priority filter ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في مهامي…"
            className="pe-9"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriorityFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                priorityFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Task grid ── */}
      {filtered.length === 0 ? (
        <EmptyState
          tab={activeTab}
          hasSearch={search.trim().length > 0 || priorityFilter !== "all"}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => (
            <MyTaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  bg,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon?: React.ElementType;
}) {
  return (
    <div className={cn("rounded-xl p-4 text-center", bg)}>
      <div className={cn("text-2xl font-bold flex items-center justify-center gap-1.5", color)}>
        {Icon && <Icon className="h-5 w-5" />}
        {value}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab, hasSearch }: { tab: TabId; hasSearch: boolean }) {
  const TAB_LABELS: Record<TabId, string> = {
    pending: "جديدة",
    in_progress: "قيد التنفيذ",
    on_hold: "بانتظار المراجعة",
    completed: "مكتملة",
  };

  const TAB_ICONS: Record<TabId, React.ElementType> = {
    pending: ListTodo,
    in_progress: PlayCircle,
    on_hold: PauseCircle,
    completed: CheckCircle2,
  };

  const Icon = TAB_ICONS[tab];

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          {hasSearch ? "لا توجد نتائج" : `لا توجد مهام ${TAB_LABELS[tab]}`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {hasSearch
            ? "جرّب تغيير معايير البحث أو الفلترة"
            : tab === "completed"
            ? "أكمل مهامك وستظهر هنا"
            : "استلم مهمة من قسم إسناد الأعمال"}
        </p>
      </div>
    </div>
  );
}
