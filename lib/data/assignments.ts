import { requireAuthenticated } from "@/lib/auth/guards";
import type { Task, TaskPriority, TaskStatus } from "@/types/database";

// ─── Joined shape returned by both queries ────────────────────────────────────

export interface TaskWithRelations extends Task {
  creator: { full_name: string } | null;
  assignee: { full_name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityOrder(p: TaskPriority): number {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}

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
    .select(
      `*, creator:employees!tasks_created_by_fkey(full_name), assignee:employees!tasks_assigned_to_fkey(full_name)`
    )
    .eq("team_id", teamId)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (dbErr) return { tasks: [], error: dbErr.message };

  const tasks = (data ?? []) as unknown as TaskWithRelations[];
  tasks.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

  return { tasks, error: null };
}

// ─── Running tasks (non-available, non-cancelled, team-scoped) ───────────────

const RUNNING_STATUSES: TaskStatus[] = [
  "in_progress",
  "pending",
  "on_hold",
  "completed",
];

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
    .select(
      `*, creator:employees!tasks_created_by_fkey(full_name), assignee:employees!tasks_assigned_to_fkey(full_name)`
    )
    .eq("team_id", teamId)
    .in("status", RUNNING_STATUSES)
    .order("updated_at", { ascending: false });

  if (dbErr) return { tasks: [], error: dbErr.message };

  return { tasks: (data ?? []) as unknown as TaskWithRelations[], error: null };
}
