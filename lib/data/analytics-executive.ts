/**
 * Executive Analytics — Data Layer
 *
 * All data fetching and computation lives here.
 * Components receive typed interfaces only — no raw Supabase calls in UI.
 * Redesign the UI freely without touching this file.
 */

import { requireAuthenticated } from "@/lib/auth/guards";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type WorkloadLevel = "low" | "normal" | "high" | "critical";
export type InsightSeverity = "info" | "warning" | "danger" | "success";
export type DistributionView = "status" | "priority";

// Hero metrics
export interface HeroMetrics {
  totalTasks: number;
  completionRate: number;  // 0–100
  activeTasks: number;     // in_progress + pending
  overdueTasks: number;    // past due_date, not completed/cancelled
}

// Team workload (one row in the horizontal bar chart)
export interface TeamWorkloadMetrics {
  teamId: string;
  teamName: string;
  memberCount: number;
  total: number;
  active: number;          // in_progress + pending
  completed: number;
  overdue: number;
  onHold: number;          // on_hold (awaiting review)
  available: number;
  completionRate: number;  // 0–100
  workloadScore: number;   // active / memberCount (tasks per person)
  workloadLevel: WorkloadLevel;
}

// Slice in the donut chart
export interface DistributionSlice {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

// Task distribution (donut chart data)
export interface TaskDistributionMetrics {
  byStatus: DistributionSlice[];
  byPriority: DistributionSlice[];
  total: number;
}

// One live insight alert
export interface LiveInsight {
  id: string;
  severity: InsightSeverity;
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

// Root data object passed to the client component
export interface ExecutiveAnalyticsData {
  heroMetrics: HeroMetrics;
  teamWorkloads: TeamWorkloadMetrics[];
  taskDistribution: TaskDistributionMetrics;
  insights: LiveInsight[];
  viewerRole: string;
  viewerTeamId: string | null;
  generatedAt: string;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  in_progress: { label: "جارية",            color: "#3b82f6", order: 1 },
  pending:     { label: "جديدة",            color: "#f59e0b", order: 2 },
  on_hold:     { label: "بانتظار المراجعة", color: "#8b5cf6", order: 3 },
  overdue:     { label: "متأخرة",           color: "#ef4444", order: 4 },
  completed:   { label: "مكتملة",           color: "#10b981", order: 5 },
  available:   { label: "متاحة",            color: "#6b7280", order: 6 },
  cancelled:   { label: "ملغاة",            color: "#9ca3af", order: 7 },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  urgent: { label: "عاجل",    color: "#ef4444", order: 1 },
  high:   { label: "عالية",   color: "#f97316", order: 2 },
  medium: { label: "متوسطة",  color: "#f59e0b", order: 3 },
  low:    { label: "منخفضة",  color: "#6b7280", order: 4 },
};

// ─── Computation helpers ──────────────────────────────────────────────────────

function workloadLevel(score: number): WorkloadLevel {
  if (score < 1) return "low";
  if (score < 2.5) return "normal";
  if (score < 4) return "high";
  return "critical";
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// ─── Pure insight engine ──────────────────────────────────────────────────────

export function computeInsights(
  workloads: TeamWorkloadMetrics[],
  hero: HeroMetrics
): LiveInsight[] {
  const insights: LiveInsight[] = [];

  // 1 — Most loaded team
  const criticalTeams = workloads.filter((t) => t.workloadLevel === "critical");
  const highTeams = workloads.filter((t) => t.workloadLevel === "high");
  const pressuredTeams = criticalTeams.length > 0 ? criticalTeams : highTeams;
  if (pressuredTeams.length > 0) {
    const top = pressuredTeams.reduce((a, b) =>
      a.workloadScore > b.workloadScore ? a : b
    );
    insights.push({
      id: "top-loaded",
      severity: top.workloadLevel === "critical" ? "danger" : "warning",
      icon: "🔥",
      title: "الفريق الأكثر ضغطًا",
      description: `${top.teamName} — ${top.active} مهمة نشطة على ${top.memberCount} أعضاء`,
      metric: `${top.workloadScore.toFixed(1)} مهمة / عضو`,
    });
  }

  // 2 — Low completion rate teams
  const lowCompletionTeams = workloads.filter(
    (t) => t.completionRate < 40 && t.total > 2
  );
  for (const team of lowCompletionTeams.slice(0, 2)) {
    insights.push({
      id: `low-completion-${team.teamId}`,
      severity: "warning",
      icon: "📉",
      title: "انخفاض في معدل الإنجاز",
      description: `${team.teamName} — معدل الإنجاز منخفض`,
      metric: `${team.completionRate}%`,
    });
  }

  // 3 — Many on_hold tasks
  const totalOnHold = workloads.reduce((s, t) => s + t.onHold, 0);
  if (totalOnHold >= 3) {
    const busyTeam = workloads.reduce((a, b) => (a.onHold > b.onHold ? a : b));
    insights.push({
      id: "many-on-hold",
      severity: totalOnHold >= 6 ? "danger" : "warning",
      icon: "⏸️",
      title: "كثرة المهام بانتظار المراجعة",
      description: `${totalOnHold} مهمة بانتظار المراجعة — أعلاها ${busyTeam.teamName}`,
      metric: `${busyTeam.onHold} مهمة في ${busyTeam.teamName}`,
    });
  }

  // 4 — Overdue spike
  const overdueRatio = hero.activeTasks > 0
    ? (hero.overdueTasks / hero.activeTasks) * 100
    : 0;
  if (hero.overdueTasks >= 3) {
    insights.push({
      id: "overdue-spike",
      severity: overdueRatio > 25 ? "danger" : "warning",
      icon: "⚠️",
      title: "زيادة في المهام المتأخرة",
      description: `${hero.overdueTasks} مهمة تجاوزت تاريخ التسليم`,
      metric: `${Math.round(overdueRatio)}% من المهام النشطة`,
    });
  }

  // 5 — Good news: high completion rate
  if (insights.length === 0 && hero.completionRate >= 80) {
    insights.push({
      id: "great-performance",
      severity: "success",
      icon: "🎉",
      title: "أداء ممتاز",
      description: "معدل الإنجاز عالٍ وعبء العمل موزع بشكل جيد",
      metric: `${hero.completionRate}% معدل إنجاز`,
    });
  }

  // 6 — Default: all clear
  if (insights.length === 0) {
    insights.push({
      id: "all-clear",
      severity: "info",
      icon: "✅",
      title: "الوضع مستقر",
      description: "لا توجد تنبيهات حرجة في الوقت الحالي",
    });
  }

  return insights;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

interface RawTask {
  team_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

export async function getExecutiveAnalyticsData(): Promise<ExecutiveAnalyticsData> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error || !supabase) {
    return emptyData();
  }

  const role = context.employee.role;
  const isManager = role === "super_admin" || role === "track_manager";
  const teamId = context.employee.team_id;

  // For non-managers, fall back to their own team
  const isSuperAdmin = role === "super_admin";

  // ── Parallel fetches ──────────────────────────────────────────────────────

  const [teamsRes, tasksRes, employeesRes] = await Promise.all([
    // All active teams (super_admin sees all, manager sees own team only)
    isSuperAdmin
      ? supabase.from("teams").select("id, name").eq("is_active", true).order("name")
      : supabase.from("teams").select("id, name").eq("id", teamId ?? "").eq("is_active", true),

    // Tasks: only fields needed for analytics
    isSuperAdmin
      ? supabase.from("tasks").select("team_id, status, priority, due_date")
      : supabase.from("tasks").select("team_id, status, priority, due_date").eq("team_id", teamId ?? ""),

    // Employee counts per team
    supabase.from("employees").select("id, team_id").eq("is_active", true),
  ]);

  const teams = (teamsRes.data ?? []) as Array<{ id: string; name: string }>;
  const tasks = (tasksRes.data ?? []) as RawTask[];
  const employees = (employeesRes.data ?? []) as Array<{ id: string; team_id: string | null }>;

  // ── Member count lookup ────────────────────────────────────────────────────

  const memberCountByTeam = new Map<string, number>();
  for (const emp of employees) {
    if (emp.team_id) {
      memberCountByTeam.set(emp.team_id, (memberCountByTeam.get(emp.team_id) ?? 0) + 1);
    }
  }

  // ── Hero metrics (global) ─────────────────────────────────────────────────

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const activeCount = tasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;
  const overdueCount = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const nonAvailableCount = tasks.filter((t) => t.status !== "available").length;

  const heroMetrics: HeroMetrics = {
    totalTasks,
    completionRate: safeRate(completedCount, nonAvailableCount),
    activeTasks: activeCount,
    overdueTasks: overdueCount,
  };

  // ── Team workloads ────────────────────────────────────────────────────────

  const teamWorkloads: TeamWorkloadMetrics[] = teams.map((team) => {
    const teamTasks = tasks.filter((t) => t.team_id === team.id);
    const memberCount = memberCountByTeam.get(team.id) ?? 0;

    const completed = teamTasks.filter((t) => t.status === "completed").length;
    const active = teamTasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;
    const onHold = teamTasks.filter((t) => t.status === "on_hold").length;
    const available = teamTasks.filter((t) => t.status === "available").length;
    const overdue = teamTasks.filter((t) => isOverdue(t.due_date, t.status)).length;
    const total = teamTasks.length;
    const nonAvailable = total - available;
    const completionRate = safeRate(completed, nonAvailable);
    const score = memberCount > 0 ? Math.round((active / memberCount) * 10) / 10 : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      memberCount,
      total,
      active,
      completed,
      overdue,
      onHold,
      available,
      completionRate,
      workloadScore: score,
      workloadLevel: workloadLevel(score),
    };
  });

  // Sort: highest workload first
  teamWorkloads.sort((a, b) => b.workloadScore - a.workloadScore);

  // ── Task distribution ─────────────────────────────────────────────────────

  const statusCount = new Map<string, number>();
  const priorityCount = new Map<string, number>();

  for (const t of tasks) {
    statusCount.set(t.status, (statusCount.get(t.status) ?? 0) + 1);
    priorityCount.set(t.priority, (priorityCount.get(t.priority) ?? 0) + 1);
  }

  const byStatus: DistributionSlice[] = Object.entries(STATUS_CONFIG)
    .filter(([key]) => (statusCount.get(key) ?? 0) > 0)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, conf]) => {
      const count = statusCount.get(key) ?? 0;
      return {
        key,
        label: conf.label,
        count,
        percentage: safeRate(count, totalTasks),
        color: conf.color,
      };
    });

  const byPriority: DistributionSlice[] = Object.entries(PRIORITY_CONFIG)
    .filter(([key]) => (priorityCount.get(key) ?? 0) > 0)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, conf]) => {
      const count = priorityCount.get(key) ?? 0;
      return {
        key,
        label: conf.label,
        count,
        percentage: safeRate(count, totalTasks),
        color: conf.color,
      };
    });

  const taskDistribution: TaskDistributionMetrics = {
    byStatus,
    byPriority,
    total: totalTasks,
  };

  // ── Insights ──────────────────────────────────────────────────────────────

  const insights = computeInsights(teamWorkloads, heroMetrics);

  return {
    heroMetrics,
    teamWorkloads,
    taskDistribution,
    insights,
    viewerRole: role,
    viewerTeamId: teamId,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Empty fallback ───────────────────────────────────────────────────────────

function emptyData(): ExecutiveAnalyticsData {
  return {
    heroMetrics: { totalTasks: 0, completionRate: 0, activeTasks: 0, overdueTasks: 0 },
    teamWorkloads: [],
    taskDistribution: { byStatus: [], byPriority: [], total: 0 },
    insights: [],
    viewerRole: "team_member",
    viewerTeamId: null,
    generatedAt: new Date().toISOString(),
  };
}
