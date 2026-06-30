"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated } from "@/lib/auth/guards";

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

  revalidatePath("/dashboard/assignments");
  return { error: null };
}
