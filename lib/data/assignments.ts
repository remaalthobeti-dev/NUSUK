import { requireAuthenticated } from "@/lib/auth/guards";
import type { Task, TaskPriority, TaskStatus } from "@/types/database";

// ─── Joined shapes ────────────────────────────────────────────────────────────

export interface TaskWithRelations extends Task {
  creator: { full_name: string } | null;
  assignee: { full_name: string } | null;
  team: { name: string } | null;
  participants: Array<{ id: string; left_at: string | null }>;
}

export interface TaskWithReviewRelations extends Task {
  creator: { full_name: string } | null;
  assignee: { full_name: string } | null;
  team: { name: string } | null;
  participants: Array<{
    id: string;
    left_at: string | null;
    employee: { full_name: string } | null;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function priorityOrder(p: TaskPriority): number {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}

const SELECT = `
  *,
  creator:employees!tasks_created_by_fkey(full_name),
  assignee:employees!tasks_assigned_to_fkey(full_name),
  team:teams!tasks_team_id_fkey(name),
  participants:task_participants(id, left_at)
`.trim();

const REVIEW_SELECT = `
  *,
  creator:employees!tasks_created_by_fkey(full_name),
  assignee:employees!tasks_assigned_to_fkey(full_name),
  team:teams!tasks_team_id_fkey(name),
  participants:task_participants(id, left_at, employee:employees!task_participants_employee_id_fkey(full_name))
`.trim();

// ─── Available tasks (status = 'available', team-scoped) ─────────────────────

export async function getAvailableTasks(): Promise<{
  tasks: TaskWithRelations[];
  error: string | null;
}> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { tasks: [], error };

  const teamId = context.employee.team_id;
  if (!teamId) return { tasks: [], error: null };

  const { data, error: dbErr } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (dbErr) return { tasks: [], error: dbErr.message };

  return { tasks: (data ?? []) as unknown as TaskWithRelations[], error: null };
}

// ─── Running tasks (in_progress, pending, completed — excludes on_hold) ──────

const RUNNING_STATUSES: TaskStatus[] = ["in_progress", "pending", "completed"];

export async function getRunningTasks(): Promise<{
  tasks: TaskWithRelations[];
  error: string | null;
}> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { tasks: [], error };

  const teamId = context.employee.team_id;
  if (!teamId) return { tasks: [], error: null };

  const { data, error: dbErr } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .in("status", RUNNING_STATUSES)
    .order("updated_at", { ascending: false });

  if (dbErr) return { tasks: [], error: dbErr.message };

  return { tasks: (data ?? []) as unknown as TaskWithRelations[], error: null };
}

// ─── Review tasks (status = 'on_hold', managers only) ────────────────────────

export async function getReviewTasks(): Promise<{
  tasks: TaskWithReviewRelations[];
  error: string | null;
}> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { tasks: [], error };

  const role = context.employee.role;
  const isManager = role === "super_admin" || role === "track_manager";
  if (!isManager) return { tasks: [], error: null };

  const teamId = context.employee.team_id;

  let query = supabase
    .from("tasks")
    .select(REVIEW_SELECT)
    .eq("status", "on_hold")
    .order("updated_at", { ascending: false });

  // track_manager sees only their team; super_admin sees all
  if (role === "track_manager" && teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error: dbErr } = await query;
  if (dbErr) return { tasks: [], error: dbErr.message };

  return {
    tasks: (data ?? []) as unknown as TaskWithReviewRelations[],
    error: null,
  };
}
