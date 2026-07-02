"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated, requireManager } from "@/lib/auth/guards";
import type { AvailabilityStatus, TaskPriority } from "@/types/database";

export async function updateMyStatusAction(
  status: AvailabilityStatus
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { error: dbErr } = await supabase
    .from("employee_presence")
    .upsert(
      {
        employee_id: context.employee.id,
        availability_status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );

  if (dbErr) return { error: dbErr.message };
  revalidatePath("/dashboard");
  return { error: null };
}

export interface AssignQuickTaskPayload {
  title: string;
  description: string | null;
  priority: TaskPriority;
  estimatedHours: number;
  teamId: string;
  assigneeId: string;
}

export async function assignQuickTaskAction(
  payload: AssignQuickTaskPayload
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireManager();
  if (error) return { error };

  // track_manager can only assign within their own team
  if (
    context.employee.role === "track_manager" &&
    payload.teamId !== context.employee.team_id
  ) {
    return { error: "يمكنك تكليف المهام لفريقك فقط" };
  }

  const now = new Date().toISOString();
  const dueDate = new Date(
    Date.now() + payload.estimatedHours * 3_600_000
  ).toISOString();

  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      status: "in_progress",
      priority: payload.priority,
      team_id: payload.teamId,
      assigned_to: payload.assigneeId,
      created_by: context.employee.id,
      started_at: now,
      due_date: dueDate,
      estimated_minutes: Math.round(payload.estimatedHours * 60),
    })
    .select("id")
    .single();

  if (taskErr || !task) return { error: taskErr?.message ?? "فشل إنشاء المهمة" };

  // Update assignee presence to busy
  await supabase
    .from("employee_presence")
    .upsert(
      {
        employee_id: payload.assigneeId,
        availability_status: "busy",
        notes: `مكلف بمهمة: ${payload.title}`,
        updated_at: now,
      },
      { onConflict: "employee_id" }
    );

  // Log to task_activity (consistent with rest of codebase)
  await supabase.from("task_activity").insert({
    task_id: task.id,
    employee_id: context.employee.id,
    event_type: "task_assigned",
    description: `كلّف ${context.employee.full_name} الموظف بالمهمة`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/operations");
  revalidatePath("/dashboard/assignments");
  return { error: null };
}
