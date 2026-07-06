"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ListTodo,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Search,
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  Activity,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MyTaskCard } from "./my-task-card";
import { EmptyState as SharedEmptyState } from "@/components/shared/empty-state";
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
  activeColor: string;
  activeBg: string;
}> = [
  {
    id: "pending",
    label: "جديدة",
    icon: ListTodo,
    status: "pending",
    activeColor: "text-amber-700 dark:text-amber-400",
    activeBg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    id: "in_progress",
    label: "قيد التنفيذ",
    icon: PlayCircle,
    status: "in_progress",
    activeColor: "text-blue-700 dark:text-blue-400",
    activeBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "on_hold",
    label: "بانتظار المراجعة",
    icon: PauseCircle,
    status: "on_hold",
    activeColor: "text-purple-700 dark:text-purple-400",
    activeBg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "completed",
    label: "مكتملة",
    icon: CheckCircle2,
    status: "completed",
    activeColor: "text-emerald-700 dark:text-emerald-400",
    activeBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | "all"; label: string }> = [
  { value: "all", label: "الكل" },
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
      return (
        new Date(t.completed_at).toLocaleDateString("en-CA", {
          timeZone: "Asia/Riyadh",
        }) === todayStr
      );
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
                newStatus === "completed"
                  ? new Date().toISOString()
                  : t.completed_at,
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
        TABS.map((tab) => [tab.id, tasks.filter((t) => t.status === tab.status).length])
      ) as Record<TabId, number>,
    [tasks]
  );

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-5">
      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="إجمالي مهامي"
          value={stats.total}
          icon={LayoutGrid}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          valueColor="text-foreground"
        />
        <StatCard
          label="قيد التنفيذ"
          value={stats.in_progress}
          icon={Activity}
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          iconColor="text-blue-600 dark:text-blue-400"
          valueColor="text-blue-700 dark:text-blue-400"
        />
        <StatCard
          label="مكتملة اليوم"
          value={stats.completedToday}
          icon={TrendingUp}
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          valueColor="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          label="متأخرة"
          value={stats.overdue}
          icon={AlertTriangle}
          iconBg={
            stats.overdue > 0
              ? "bg-red-50 dark:bg-red-950/30"
              : "bg-muted/50"
          }
          iconColor={
            stats.overdue > 0
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          }
          valueColor={
            stats.overdue > 0
              ? "text-red-700 dark:text-red-400"
              : "text-muted-foreground"
          }
          pulse={stats.overdue > 0}
        />
      </div>

      {/* ── Tabs bar ── */}
      <div className="rounded-2xl border bg-card p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap min-w-fit",
                isActive
                  ? cn(
                      "shadow-sm border border-border/50",
                      tab.activeBg,
                      tab.activeColor
                    )
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums leading-none",
                  isActive
                    ? "bg-current/10 text-current"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: search + priority ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في مهامي…"
            className="pe-9 h-9 text-sm bg-card"
          />
        </div>

        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriorityFilter(opt.value)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                priorityFilter === opt.value
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-1.5 h-4 rounded-full shrink-0",
            activeTab === "in_progress" && "bg-blue-500",
            activeTab === "pending" && "bg-amber-400",
            activeTab === "on_hold" && "bg-purple-500",
            activeTab === "completed" && "bg-emerald-500"
          )}
        />
        <h2 className="text-sm font-semibold text-foreground">
          {activeTabConfig.label}
        </h2>
        <span className="text-xs text-muted-foreground">
          ({filtered.length} مهمة)
        </span>
        {search.trim() && (
          <span className="text-xs text-muted-foreground/60 italic">
            — نتائج البحث عن "{search}"
          </span>
        )}
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
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative",
          iconBg
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
        {pulse && (
          <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold tabular-nums leading-none", valueColor)}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
      </div>
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
    <SharedEmptyState
      size="lg"
      icon={<Icon />}
      title={hasSearch ? "لا توجد نتائج" : `لا توجد مهام ${TAB_LABELS[tab]}`}
      description={
        hasSearch
          ? "جرّب تغيير معايير البحث أو الفلترة"
          : tab === "completed"
          ? "أكمل مهامك وستظهر هنا"
          : "استلم مهمة من قسم إسناد الأعمال"
      }
    />
  );
}
