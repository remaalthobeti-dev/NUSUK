"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticated } from "@/lib/auth/guards";
import { notifyCommentAdded } from "@/lib/services/notifications";
import type { Database, TaskRequestType } from "@/types/database";

// ─── Security helper ──────────────────────────────────────────────────────────
// Returns the task only if it belongs to the current employee's team.
async function verifyTaskInTeam(
  supabase: SupabaseClient<Database>,
  taskId: string,
  teamId: string
) {
  const { data } = await supabase
    .from("tasks")
    .select("id, team_id, assigned_to")
    .eq("id", taskId)
    .eq("team_id", teamId)
    .single();
  return data;
}

function revalidate(taskId: string) {
  revalidatePath(`/dashboard/assignments/${taskId}`);
  revalidatePath("/dashboard/assignments");
}

// ─── Request collaboration / review ──────────────────────────────────────────

export async function sendTaskRequestAction(
  taskId: string,
  requesteeId: string,
  requestType: TaskRequestType
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const teamId = context.employee.team_id;
  if (!teamId) return { error: "لا تنتمي إلى فريق" };

  // Verify task is in this team
  const task = await verifyTaskInTeam(supabase, taskId, teamId);
  if (!task) return { error: "المهمة غير موجودة أو لا تنتمي إلى فريقك" };

  // Verify requestee is in the same team (never trust the client)
  const { data: requestee } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("id", requesteeId)
    .eq("team_id", teamId)
    .eq("is_active", true)
    .single();
  if (!requestee) return { error: "الموظف المحدد لا ينتمي إلى فريقك" };

  // Can't send a request to yourself
  if (requesteeId === context.employee.id) return { error: "لا يمكنك إرسال طلب إلى نفسك" };

  const { error: insertErr } = await supabase.from("task_requests").insert({
    task_id: taskId,
    requester_id: context.employee.id,
    requestee_id: requesteeId,
    request_type: requestType,
  });

  if (insertErr) {
    if (insertErr.code === "23505")
      return { error: "يوجد طلب مماثل قيد الانتظار بالفعل" };
    return { error: insertErr.message };
  }

  const typeLabel = requestType === "collaboration" ? "مشاركة" : "مراجعة";
  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: `${requestType}_requested`,
    description: `أرسل ${context.employee.full_name} طلب ${typeLabel} إلى ${requestee.full_name}`,
  });

  revalidate(taskId);
  return { error: null };
}

// ─── Respond to a request (accept / reject) ───────────────────────────────────

export async function respondToRequestAction(
  requestId: string,
  response: "accepted" | "rejected"
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const teamId = context.employee.team_id;
  if (!teamId) return { error: "لا تنتمي إلى فريق" };

  // Get the request and confirm current employee is the requestee
  const { data: req } = await supabase
    .from("task_requests")
    .select("id, task_id, request_type, requester_id, requestee_id, status")
    .eq("id", requestId)
    .eq("requestee_id", context.employee.id)
    .eq("status", "pending")
    .single();

  if (!req) return { error: "الطلب غير موجود أو ليس موجهاً إليك" };

  // Verify the task is still in this team
  const task = await verifyTaskInTeam(supabase, req.task_id, teamId);
  if (!task) return { error: "المهمة لا تنتمي إلى فريقك" };

  const { error: updateErr } = await supabase
    .from("task_requests")
    .update({ status: response, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateErr) return { error: updateErr.message };

  // On accept: add to task_participants
  if (response === "accepted") {
    await supabase.from("task_participants").upsert(
      { task_id: req.task_id, employee_id: context.employee.id, joined_at: new Date().toISOString() },
      { onConflict: "task_id,employee_id" }
    );
  }

  const typeLabel = req.request_type === "collaboration" ? "المشاركة" : "المراجعة";
  const responseLabel = response === "accepted" ? "قبل" : "رفض";
  await supabase.from("task_activity").insert({
    task_id: req.task_id,
    employee_id: context.employee.id,
    event_type: `${req.request_type}_${response}`,
    description: `${responseLabel} ${context.employee.full_name} طلب ${typeLabel}`,
  });

  revalidate(req.task_id);
  return { error: null };
}

// ─── Add comment ──────────────────────────────────────────────────────────────

export async function addCommentAction(
  taskId: string,
  comment: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const teamId = context.employee.team_id;
  if (!teamId) return { error: "لا تنتمي إلى فريق" };

  if (!comment.trim()) return { error: "لا يمكن إرسال تعليق فارغ" };

  // Verify task is in this team
  const task = await verifyTaskInTeam(supabase, taskId, teamId);
  if (!task) return { error: "المهمة غير موجودة أو لا تنتمي إلى فريقك" };

  const { error: insertErr } = await supabase.from("task_comments").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    comment: comment.trim(),
  });

  if (insertErr) return { error: insertErr.message };

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "comment_added",
    description: `أضاف ${context.employee.full_name} تعليقاً`,
  });

  // Notify task owner and participants about the new comment
  const { data: taskDetail } = await supabase
    .from("tasks")
    .select("title, created_by, assigned_to")
    .eq("id", taskId)
    .single();

  if (taskDetail) {
    const { data: participants } = await supabase
      .from("task_participants")
      .select("employee_id")
      .eq("task_id", taskId);

    const participantIds = ((participants ?? []) as Array<{ employee_id: string }>).map(
      (p) => p.employee_id
    );

    const recipientSet = new Set<string>(participantIds);
    if (taskDetail.created_by) recipientSet.add(taskDetail.created_by);
    if (taskDetail.assigned_to) recipientSet.add(taskDetail.assigned_to);

    notifyCommentAdded(supabase, {
      taskId,
      taskTitle: taskDetail.title,
      commenterId: context.employee.id,
      commenterName: context.employee.full_name,
      recipientIds: Array.from(recipientSet),
      commentPreview: comment.trim(),
    }).catch(() => {});
  }

  revalidate(taskId);
  return { error: null };
}
