/**
 * Admin data layer — fetches cross-team aggregations, analytics,
 * settings entities, notifications, and audit logs.
 * All functions run server-side with the authenticated Supabase client.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Team,
  Employee,
  EmployeePresence,
  AvailabilityStatus,
  ActivityLog,
  Notification,
} from "@/types/database";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminTeamCard {
  team: Team;
  employeeCount: number;
  presenceSummary: Record<AvailabilityStatus, number>;
  avgWorkload: number;
}

export interface GlobalStats {
  totalEmployees: number;
  totalPresent: number;
  byStatus: Record<AvailabilityStatus, number>;
}

export interface AdminOverviewData {
  teams: AdminTeamCard[];
  globalStats: GlobalStats;
}

export interface AnalyticsData {
  completedToday: number;
  activeTasksCount: number;
  avgTaskDurationHours: number;
  mostActiveEmployee: { name: string; count: number } | null;
  employeeWorkloads: Array<{ name: string; workload: number; team: string }>;
  teamWorkloads: Array<{ name: string; avg: number; count: number }>;
  taskStatusCounts: Array<{ status: string; label: string; count: number; fill: string }>;
  completionsByTeam: Array<{ name: string; completed: number; active: number }>;
}

export interface EmployeeForSettings extends Employee {
  teamName: string | null;
  teamColor: string | null;
}

export interface TeamForSettings extends Team {
  employeeCount: number;
  distributionRole: "distribution" | "corporate" | null;
}

export interface AuditLogEntry extends ActivityLog {
  actorName: string | null;
  actorRole: string | null;
}

export interface AuditLogsResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Overview
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_SUMMARY = (): Record<AvailabilityStatus, number> => ({
  available: 0,
  busy: 0,
  in_meeting: 0,
  field_work: 0,
  remote: 0,
  offline: 0,
});

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const supabase = await createClient();

  const [teamsRes, employeesRes, presenceRes] = await Promise.all([
    supabase.from("teams").select("*").eq("is_active", true).order("created_at"),
    supabase.from("employees").select("*").eq("is_active", true),
    supabase.from("employee_presence").select("*"),
  ]);

  const teams = (teamsRes.data as Team[] | null) ?? [];
  const employees = (employeesRes.data as Employee[] | null) ?? [];
  const presences = (presenceRes.data as EmployeePresence[] | null) ?? [];

  const presenceMap = new Map<string, EmployeePresence>(
    presences.map((p) => [p.employee_id, p])
  );

  const globalByStatus = EMPTY_SUMMARY();
  let totalPresent = 0;

  const adminTeams: AdminTeamCard[] = teams.map((team) => {
    const teamEmps = employees.filter((e) => e.team_id === team.id);
    const summary = EMPTY_SUMMARY();
    let workloadSum = 0;
    let workloadCount = 0;

    teamEmps.forEach((emp) => {
      const p = presenceMap.get(emp.id);
      if (p) {
        summary[p.availability_status]++;
        globalByStatus[p.availability_status]++;
        totalPresent++;
        workloadSum += p.workload_percent;
        workloadCount++;
      }
    });

    return {
      team,
      employeeCount: teamEmps.length,
      presenceSummary: summary,
      avgWorkload: workloadCount > 0 ? Math.round(workloadSum / workloadCount) : 0,
    };
  });

  return {
    teams: adminTeams,
    globalStats: {
      totalEmployees: employees.length,
      totalPresent,
      byStatus: globalByStatus,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

const TASK_STATUS_COLORS: Record<string, string> = {
  in_progress: "#0ea5e9",
  completed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  on_hold: "#8b5cf6",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  in_progress: "جارية",
  completed: "مكتملة",
  pending: "معلقة",
  cancelled: "ملغية",
  on_hold: "موقوفة",
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    completedTodayRes,
    activeTasksRes,
    completedTasksRes,
    activityTodayRes,
    presenceRes,
    teamsRes,
    allTasksRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", todayISO),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("tasks")
      .select("started_at, completed_at")
      .eq("status", "completed")
      .not("started_at", "is", null)
      .not("completed_at", "is", null),
    supabase
      .from("activity_logs")
      .select("actor_id")
      .gte("created_at", todayISO)
      .not("actor_id", "is", null),
    supabase
      .from("employee_presence")
      .select("employee_id, workload_percent"),
    supabase.from("teams").select("id, name").eq("is_active", true),
    supabase.from("tasks").select("status, team_id"),
  ]);

  // Avg task duration
  const completedTasks = (completedTasksRes.data ?? []) as Array<{
    started_at: string;
    completed_at: string;
  }>;
  let totalDuration = 0;
  let durationCount = 0;
  for (const t of completedTasks) {
    const diff =
      (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) /
      3_600_000;
    if (diff > 0 && diff < 72) {
      totalDuration += diff;
      durationCount++;
    }
  }

  // Most active employee today
  const activityLogs = (activityTodayRes.data ?? []) as Array<{
    actor_id: string;
  }>;
  const activityCount: Record<string, number> = {};
  for (const log of activityLogs) {
    activityCount[log.actor_id] = (activityCount[log.actor_id] ?? 0) + 1;
  }

  // Look up employee names for activity leaders
  let mostActiveEmployee: { name: string; count: number } | null = null;
  if (Object.keys(activityCount).length > 0) {
    const topId = Object.entries(activityCount).sort(
      ([, a], [, b]) => b - a
    )[0][0];
    const { data: empData } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", topId)
      .single();
    if (empData) {
      mostActiveEmployee = {
        name: (empData as { full_name: string }).full_name,
        count: activityCount[topId],
      };
    }
  }

  // Employee workloads with names and teams
  const presences = (presenceRes.data ?? []) as Array<{
    employee_id: string;
    workload_percent: number;
  }>;

  // Fetch employee names + team names for presence data
  let employeeWorkloads: Array<{ name: string; workload: number; team: string }> = [];
  if (presences.length > 0) {
    const empIds = presences.map((p) => p.employee_id);
    const { data: empRows } = await supabase
      .from("employees")
      .select("id, full_name, teams!left(name)")
      .in("id", empIds);

    const empMap = new Map<string, { full_name: string; teams: { name: string } | null }>(
      ((empRows ?? []) as Array<{
        id: string;
        full_name: string;
        teams: { name: string } | null;
      }>).map((e) => [e.id, e])
    );

    employeeWorkloads = presences.map((p) => {
      const emp = empMap.get(p.employee_id);
      return {
        name: emp?.full_name ?? "غير معروف",
        workload: p.workload_percent,
        team: emp?.teams?.name ?? "",
      };
    });
  }

  // Team workloads
  const teams = (teamsRes.data ?? []) as Array<{ id: string; name: string }>;
  const teamWorkloads = teams.map((team) => ({ name: team.name, avg: 0, count: 0 }));

  if (presences.length > 0 && employeeWorkloads.length > 0) {
    teams.forEach((team, idx) => {
      const teamEmps = employeeWorkloads.filter((e) => e.team === team.name);
      const count = teamEmps.length;
      const avg =
        count > 0
          ? Math.round(teamEmps.reduce((s, e) => s + e.workload, 0) / count)
          : 0;
      teamWorkloads[idx] = { name: team.name, avg, count };
    });
  }

  // Task status distribution
  const allTasks = (allTasksRes.data ?? []) as Array<{
    status: string;
    team_id: string | null;
  }>;
  const statusMap: Record<string, number> = {};
  for (const t of allTasks) {
    statusMap[t.status] = (statusMap[t.status] ?? 0) + 1;
  }
  const taskStatusCounts = Object.entries(statusMap).map(([status, count]) => ({
    status,
    label: TASK_STATUS_LABELS[status] ?? status,
    count,
    fill: TASK_STATUS_COLORS[status] ?? "#6b7280",
  }));

  // Completions by team
  const completionsByTeam = teams.map((team) => {
    const teamTasks = allTasks.filter((t) => t.team_id === team.id);
    return {
      name: team.name,
      completed: teamTasks.filter((t) => t.status === "completed").length,
      active: teamTasks.filter((t) => t.status === "in_progress").length,
    };
  });

  return {
    completedToday: completedTodayRes.count ?? 0,
    activeTasksCount: activeTasksRes.count ?? 0,
    avgTaskDurationHours:
      durationCount > 0
        ? Math.round((totalDuration / durationCount) * 10) / 10
        : 0,
    mostActiveEmployee,
    employeeWorkloads,
    teamWorkloads,
    taskStatusCounts,
    completionsByTeam,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings — Teams
// ─────────────────────────────────────────────────────────────────────────────

export async function getTeamsForSettings(): Promise<TeamForSettings[]> {
  const supabase = await createClient();

  const [teamsRes, employeesRes, distConfigsRes] = await Promise.all([
    supabase.from("teams").select("*").order("created_at"),
    supabase.from("employees").select("id, team_id").eq("is_active", true),
    supabase.from("distribution_team_configs").select("team_id, page_role"),
  ]);

  const teams_ = (teamsRes.data as Team[] | null) ?? [];
  const employees_ = (employeesRes.data as Array<{ id: string; team_id: string | null }> | null) ?? [];
  const distConfigs = (distConfigsRes.data as Array<{ team_id: string; page_role: string }> | null) ?? [];

  const distMap = new Map(distConfigs.map((c) => [c.team_id, c.page_role as "distribution" | "corporate"]));

  return teams_.map((team) => ({
    ...team,
    employeeCount: employees_.filter((e) => e.team_id === team.id).length,
    distributionRole: distMap.get(team.id) ?? null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings — Employees
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeesForSettings(): Promise<EmployeeForSettings[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("employees")
    .select("*, teams!left(name, color)")
    .order("full_name");

  const rows = (
    data as Array<
      Employee & { teams: { name: string; color: string } | null }
    > | null
  ) ?? [];

  return rows.map((row) => ({
    ...row,
    teams: undefined,
    teamName: row.teams?.name ?? null,
    teamColor: row.teams?.color ?? null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as Notification[] | null) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditLogs(
  page = 1,
  pageSize = 25,
  actorFilter?: string
): Promise<AuditLogsResult> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actorFilter) {
    query = query.eq("actor_id", actorFilter);
  }

  const { data, count } = await query;
  const logs = (data as ActivityLog[] | null) ?? [];

  // Fetch actor names in one batch
  const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))] as string[];
  let actorMap: Map<string, { full_name: string; role: string }> = new Map();

  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("employees")
      .select("id, full_name, role")
      .in("id", actorIds);
    actorMap = new Map(
      ((actors ?? []) as Array<{ id: string; full_name: string; role: string }>).map(
        (a) => [a.id, a]
      )
    );
  }

  const enriched: AuditLogEntry[] = logs.map((log) => {
    const actor = log.actor_id ? actorMap.get(log.actor_id) : null;
    return {
      ...log,
      actorName: actor?.full_name ?? null,
      actorRole: actor?.role ?? null,
    };
  });

  return { logs: enriched, total: count ?? 0, page, pageSize };
}

// ─────────────────────────────────────────────────────────────────────────────
// All employees (for dropdowns)
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveEmployees(): Promise<
  Array<{ id: string; full_name: string; team_id: string | null }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, full_name, team_id")
    .eq("is_active", true)
    .order("full_name");
  return (
    (data as Array<{ id: string; full_name: string; team_id: string | null }> | null) ?? []
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations KPIs
// ─────────────────────────────────────────────────────────────────────────────

export interface OperationsKpis {
  taskPending: number;
  taskInProgress: number;
  taskOnHold: number;
  taskOverdue: number;
}

export async function getOperationsKpis(): Promise<OperationsKpis> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [pendingRes, inProgressRes, onHoldRes, overdueRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "on_hold"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .lt("due_date", now)
      .not("status", "in", '("completed","cancelled")'),
  ]);

  return {
    taskPending:    pendingRes.count    ?? 0,
    taskInProgress: inProgressRes.count ?? 0,
    taskOnHold:     onHoldRes.count     ?? 0,
    taskOverdue:    overdueRes.count    ?? 0,
  };
}
