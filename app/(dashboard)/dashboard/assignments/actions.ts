"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated } from "@/lib/auth/guards";
import type { TaskPriority, TaskStatus } from "@/types/database";

export interface CreateTaskPayload {
  title: string;
  description: string;
  team_id: string;
  priority: TaskPriority;
  due_date: string;
  estimated_minutes?: number | null;
  status?: TaskStatus;
  notes?: string;
  related_meeting_id?: string;
}

export async function createTaskAction(
  payload: CreateTaskPayload
): Promise<{ error: string | null; id?: string }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const role = context.employee.role;
  if (role === "team_member") return { error: "ليس لديك صلاحية إنشاء مهام" };

  if (role === "track_manager" && payload.team_id !== context.employee.team_id) {
    return { error: "يمكنك إنشاء مهام لفريقك فقط" };
  }

  const metaEntries: Record<string, string> = {};
  if (payload.notes?.trim()) metaEntries.notes = payload.notes.trim();
  if (payload.related_meeting_id) metaEntries.related_meeting_id = payload.related_meeting_id;
  const metadata = Object.keys(metaEntries).length > 0 ? metaEntries : null;

  const { data: task, error: insertErr } = await supabase
    .from("tasks")
    .insert({
      title: payload.title.trim(),
      description: payload.description.trim(),
      team_id: payload.team_id,
      priority: payload.priority,
      due_date: payload.due_date,
      estimated_minutes: payload.estimated_minutes ?? null,
      status: payload.status ?? "available",
      created_by: context.employee.id,
      metadata,
    })
    .select("id")
    .single();

  if (insertErr || !task) return { error: insertErr?.message ?? "فشل إنشاء المهمة" };

  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard");
  return { error: null, id: task.id };
}

export async function claimTaskAction(
  taskId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const teamId = context.employee.team_id;
  if (!teamId) return { error: "لا تنتمي إلى فريق" };

  // Verify the task is available AND belongs to the employee's team.
  // This check is the enforcement boundary for team isolation.
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("team_id", teamId)
    .eq("status", "available")
    .single();

  if (!task) return { error: "المهمة غير متاحة أو لا تنتمي إلى فريقك" };

  const { error: dbErr } = await supabase
    .from("tasks")
    .update({
      assigned_to: context.employee.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (dbErr) return { error: dbErr.message };

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "task_claimed",
    description: `استلم ${context.employee.full_name} المهمة`,
  });

  revalidatePath("/dashboard/assignments");
  revalidatePath(`/dashboard/assignments/${taskId}`);
  return { error: null };
}
