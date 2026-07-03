import { requireAuthenticated } from "@/lib/auth/guards";
import type { Task, TaskPriority, TaskStatus } from "@/types/database";

// ─── Joined shapes ────────────────────────────────────────────────────────────

export interface ParticipantEntry {
  id: string;
  left_at: string | null;
  employee: { id: string; full_name: string } | null;
}

export interface ReviewerEntry {
  id: string;
  status: "reviewing" | "approved" | "returned";
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  employee: { id: string; full_name: string } | null;
}

export interface TaskWithRelations extends Task {
  creator: { full_name: string } | null;
  assignee: { full_name: string } | null;
  team: { name: string } | null;
  participants: ParticipantEntry[];
  reviewers: ReviewerEntry[];
}

export interface TaskWithReviewRelations extends Task {
  creator: { full_name: string } | null;
  assignee: { full_name: string } | null;
  team: { name: string } | null;
  participants: ParticipantEntry[];
  reviewers: ReviewerEntry[];
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
  participants:task_participants(id, left_at, employee:employees!task_participants_employee_id_fkey(id, full_name)),
  reviewers:task_reviewers(id, status, started_at, completed_at, notes, employee:employees!task_reviewers_employee_id_fkey(id, full_name))
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

// ─── Review tasks (status = 'on_hold') ───────────────────────────────────────
// Managers see all team on_hold tasks.
// Team members see tasks where they are assignee OR participant.

export async function getReviewTasks(): Promise<{
  tasks: TaskWithReviewRelations[];
  error: string | null;
  currentEmployeeId: string;
}> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error)
    return { tasks: [], error, currentEmployeeId: "" };

  const teamId = context.employee.team_id;
  const role = context.employee.role;
  const employeeId = context.employee.id;
  const isManager = role === "super_admin" || role === "track_manager";

  if (!teamId && !isManager)
    return { tasks: [], error: null, currentEmployeeId: employeeId };

  // Build base query
  let query = supabase
    .from("tasks")
    .select(SELECT)
    .eq("status", "on_hold")
    .order("updated_at", { ascending: false });

  if (isManager) {
    // Managers: all on_hold tasks in their team (super_admin sees all teams via row-level RLS)
    if (teamId) query = query.eq("team_id", teamId);
  } else {
    // Team members: tasks they are the assignee of
    // Participant tasks are handled separately
    if (teamId) query = query.eq("team_id", teamId);

    // Get tasks they participate in
    const { data: parts } = await supabase
      .from("task_participants")
      .select("task_id")
      .eq("employee_id", employeeId)
      .is("left_at", null);

    const partTaskIds = ((parts ?? []) as Array<{ task_id: string }>).map(
      (p) => p.task_id
    );

    if (partTaskIds.length > 0) {
      query = query.or(
        `assigned_to.eq.${employeeId},id.in.(${partTaskIds.join(",")})`
      );
    } else {
      query = query.eq("assigned_to", employeeId);
    }
  }

  const { data, error: dbErr } = await query;
  if (dbErr)
    return { tasks: [], error: dbErr.message, currentEmployeeId: employeeId };

  return {
    tasks: (data ?? []) as unknown as TaskWithReviewRelations[],
    error: null,
    currentEmployeeId: employeeId,
  };
}
