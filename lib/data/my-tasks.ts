import { requireAuthenticated } from "@/lib/auth/guards";
import type { TaskPriority, TaskStatus } from "@/types/database";

export interface MyTask {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  team_id: string | null;
  created_by: string | null;
  assigned_to: string | null;
  metadata: unknown;
  creator: { full_name: string } | null;
  team: { name: string } | null;
}

export interface MyTasksResult {
  tasks: MyTask[];
  employeeId: string;
  error: string | null;
}

export async function getMyTasks(): Promise<MyTasksResult> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { tasks: [], employeeId: "", error };

  const { data, error: dbErr } = await supabase
    .from("tasks")
    .select(
      `*, creator:employees!tasks_created_by_fkey(full_name), team:teams!tasks_team_id_fkey(name)`
    )
    .eq("assigned_to", context.employee.id)
    .not("status", "in", '("available","cancelled")')
    .order("updated_at", { ascending: false });

  if (dbErr) return { tasks: [], employeeId: context.employee.id, error: dbErr.message };

  return {
    tasks: (data ?? []) as unknown as MyTask[],
    employeeId: context.employee.id,
    error: null,
  };
}
