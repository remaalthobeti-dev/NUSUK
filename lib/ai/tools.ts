/**
 * Data-fetching tools for the Nassaq AI Assistant.
 * Each function queries Supabase and returns structured data.
 * Role filtering is applied: super_admin sees all, others see their scope.
 */

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export interface EmployeeContext {
  id: string;
  teamId: string | null;
  role: UserRole;
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export async function getTaskStats(ctx: EmployeeContext) {
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("status, priority, assigned_to, team_id");

  if (ctx.role === "team_member") {
    query = query.eq("assigned_to", ctx.id);
  } else if (ctx.role === "track_manager" && ctx.teamId) {
    query = query.eq("team_id", ctx.teamId);
  }

  const { data, error } = await query;
  if (error || !data) return null;

  const total = data.length;
  const byStatus = data.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total,
    pending: byStatus["pending"] ?? 0,
    in_progress: byStatus["in_progress"] ?? 0,
    completed: byStatus["completed"] ?? 0,
    cancelled: byStatus["cancelled"] ?? 0,
  };
}

export async function getMyTasks(ctx: EmployeeContext) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("assigned_to", ctx.id)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("due_date", { ascending: true })
    .limit(5);

  return data ?? [];
}

// ── Team presence ─────────────────────────────────────────────────────────

export async function getTeamPresence(ctx: EmployeeContext) {
  const supabase = await createClient();

  let empQuery = supabase
    .from("employees")
    .select("id, full_name, team_id")
    .eq("is_active", true);

  if (ctx.role === "track_manager" && ctx.teamId) {
    empQuery = empQuery.eq("team_id", ctx.teamId);
  }

  const { data: employees } = await empQuery;
  if (!employees?.length) return { online: 0, total: 0, statuses: [] };

  const empIds = employees.map((e) => e.id);

  const { data: presences } = await supabase
    .from("employee_presence")
    .select("employee_id, availability_status")
    .in("employee_id", empIds);

  const presenceMap = new Map(presences?.map((p) => [p.employee_id, p.availability_status]) ?? []);

  const statuses = employees.map((e) => ({
    name: e.full_name,
    status: presenceMap.get(e.id) ?? "offline",
  }));

  const online = statuses.filter((s) => s.status !== "offline").length;

  return { online, total: employees.length, statuses };
}

// ── Factory pressure ──────────────────────────────────────────────────────

export async function getFactoryPressure() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("factory_pressure")
    .select("level, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

// ── Distribution ──────────────────────────────────────────────────────────

export async function getDistributionSummary(ctx: EmployeeContext) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("distribution_requests")
    .select("status, team_id");

  if (ctx.role === "track_manager" && ctx.teamId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq("team_id", ctx.teamId);
  }

  const { data } = await query;
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byStatus = (data as any[]).reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    total: (data as any[]).length,
    pending: byStatus["pending"] ?? 0,
    in_progress: byStatus["in_progress"] ?? 0,
    completed: byStatus["completed"] ?? 0,
  };
}

// ── Meetings ──────────────────────────────────────────────────────────────

export async function getUpcomingMeetings(ctx: EmployeeContext) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("meetings")
    .select("id, title, start_time, status, team_id")
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(3);

  return data ?? [];
}
