"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated } from "@/lib/auth/guards";
import {
  notifyTaskCreated,
  notifyTaskClaimed,
  notifyTaskStatusChanged,
} from "@/lib/services/notifications";
import type { TaskPriority, TaskStatus } from "@/types/database";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  available: "متاحة",
  pending: "جديدة",
  in_progress: "جارية",
  on_hold: "بانتظار المراجعة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export interface TaskAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

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

  // Log creation event
  await supabase.from("task_activity").insert({
    task_id: task.id,
    employee_id: context.employee.id,
    event_type: "task_created",
    description: `أنشأ ${context.employee.full_name} المهمة`,
  });

  // Fire-and-forget notifications (do not block the response)
  notifyTaskCreated(supabase, {
    taskId: task.id,
    taskTitle: payload.title.trim(),
    teamId: payload.team_id,
    creatorId: context.employee.id,
    creatorName: context.employee.full_name,
  }).catch(() => {});

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
    .select("id, title, created_by")
    .eq("id", taskId)
    .eq("team_id", teamId)
    .eq("status", "available")
    .single();

  if (!task) return { error: "المهمة غير متاحة أو لا تنتمي إلى فريقك" };

  const { data: updated, error: dbErr } = await supabase
    .from("tasks")
    .update({
      assigned_to: context.employee.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (dbErr) return { error: dbErr.message };
  if (!updated) return { error: "فشل استلام المهمة — ربما تم استلامها مسبقاً أو لا تملك الصلاحية" };

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "task_claimed",
    description: `استلم ${context.employee.full_name} المهمة`,
  });

  notifyTaskClaimed(supabase, {
    taskId,
    taskTitle: task.title,
    assigneeId: context.employee.id,
    assigneeName: context.employee.full_name,
    createdById: task.created_by,
  }).catch(() => {});

  revalidatePath("/dashboard/assignments");
  revalidatePath(`/dashboard/assignments/${taskId}`);
  return { error: null };
}

export async function updateTaskAttachmentsAction(
  taskId: string,
  attachments: TaskAttachment[]
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { data: task } = await supabase
    .from("tasks")
    .select("id, created_by, metadata")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "المهمة غير موجودة" };
  if (task.created_by !== context.employee.id)
    return { error: "ليس لديك صلاحية تعديل هذه المهمة" };

  const existingMeta = (task.metadata as Record<string, unknown>) ?? {};
  const newMetadata = JSON.parse(JSON.stringify({ ...existingMeta, attachments }));
  const { error: updateErr } = await supabase
    .from("tasks")
    .update({ metadata: newMetadata })
    .eq("id", taskId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "attachment_added",
    description: `أضاف ${context.employee.full_name} مرفقات إلى المهمة`,
  });

  revalidatePath(`/dashboard/assignments/${taskId}`);
  return { error: null };
}

// ─── Shared: collect task recipients (assignee + active participants) ─────────

async function collectTaskRecipients(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: NonNullable<Awaited<ReturnType<typeof requireAuthenticated>>["supabase"]>,
  taskId: string,
  assignedTo: string | null,
  excludeId: string
): Promise<string[]> {
  const set = new Set<string>();
  if (assignedTo) set.add(assignedTo);
  const { data: parts } = await supabase
    .from("task_participants")
    .select("employee_id")
    .eq("task_id", taskId)
    .is("left_at", null);
  ((parts ?? []) as Array<{ employee_id: string }>).forEach((p) =>
    set.add(p.employee_id)
  );
  set.delete(excludeId);
  return Array.from(set);
}

// ─── Start review (any team member who is not the assignee) ──────────────────

export async function startReviewAction(
  taskId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const teamId = context.employee.team_id;
  if (!teamId) return { error: "لا تنتمي إلى فريق" };

  // Fetch task: must be on_hold and in same team
  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_to, team_id")
    .eq("id", taskId)
    .eq("team_id", teamId)
    .single();

  if (!task) return { error: "المهمة غير موجودة أو لا تنتمي إلى فريقك" };
  if (task.status !== "on_hold") return { error: "المهمة ليست بانتظار المراجعة" };
  if (task.assigned_to === context.employee.id)
    return { error: "لا يمكنك مراجعة مهمة أُسندت إليك" };

  // Check no active reviewer already
  const { data: existing } = await supabase
    .from("task_reviewers")
    .select("id, employee_id")
    .eq("task_id", taskId)
    .eq("status", "reviewing")
    .maybeSingle();

  if (existing)
    return { error: "المهمة قيد المراجعة بالفعل من قِبل موظف آخر" };

  const { error: insertErr } = await supabase.from("task_reviewers").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    status: "reviewing",
    started_at: new Date().toISOString(),
  });

  if (insertErr) return { error: insertErr.message };

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "review_started",
    description: `بدأ ${context.employee.full_name} مراجعة المهمة`,
  });

  // Notify assignee + participants
  const recipients = await collectTaskRecipients(
    supabase,
    taskId,
    task.assigned_to,
    context.employee.id
  );
  if (recipients.length > 0) {
    await supabase.from("notifications").insert(
      recipients.map((id) => ({
        recipient_id: id,
        type: "task_updated" as const,
        title: "بدأت مراجعة مهمتك",
        body: `بدأ ${context.employee.full_name} مراجعة "${task.title}"`,
        sender_id: context.employee.id,
        data: { task_id: taskId },
      }))
    );
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath(`/dashboard/assignments/${taskId}`);
  return { error: null };
}

// ─── Approve task (on_hold → completed) ──────────────────────────────────────
// Allowed: the active reviewer OR a manager (when no reviewer or as override)

export async function approveTaskAction(
  taskId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const role = context.employee.role;
  const isManager = role === "super_admin" || role === "track_manager";

  // Check if current employee is the active reviewer
  const { data: reviewer } = await supabase
    .from("task_reviewers")
    .select("id")
    .eq("task_id", taskId)
    .eq("employee_id", context.employee.id)
    .eq("status", "reviewing")
    .maybeSingle();

  if (!reviewer && !isManager)
    return { error: "يجب عليك بدء المراجعة أولاً قبل الاعتماد" };

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_to, team_id")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "المهمة غير موجودة" };
  if (task.status !== "on_hold") return { error: "المهمة ليست بانتظار المراجعة" };

  const now = new Date().toISOString();

  // Update task status
  const { error: updateErr } = await supabase
    .from("tasks")
    .update({ status: "completed", updated_at: now, completed_at: now })
    .eq("id", taskId);
  if (updateErr) return { error: updateErr.message };

  // Mark reviewer record as approved (if exists)
  if (reviewer) {
    await supabase
      .from("task_reviewers")
      .update({ status: "approved", completed_at: now })
      .eq("id", reviewer.id);
  } else if (isManager) {
    // Manager approved without going through start-review — create a completed record
    await supabase.from("task_reviewers").insert({
      task_id: taskId,
      employee_id: context.employee.id,
      status: "approved",
      started_at: now,
      completed_at: now,
    });
  }

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "task_approved",
    description: `اعتمد ${context.employee.full_name} المهمة وأغلقها`,
  });

  const recipients = await collectTaskRecipients(
    supabase, taskId, task.assigned_to, context.employee.id
  );
  notifyTaskStatusChanged(supabase, {
    taskId,
    taskTitle: task.title,
    newStatus: "completed",
    actorId: context.employee.id,
    actorName: context.employee.full_name,
    recipientIds: recipients,
  }).catch(() => {});

  revalidatePath("/dashboard/assignments");
  revalidatePath(`/dashboard/assignments/${taskId}`);
  revalidatePath("/dashboard/my-tasks");
  revalidatePath("/dashboard");
  return { error: null };
}

// ─── Return task (on_hold → in_progress) ─────────────────────────────────────
// Allowed: the active reviewer OR a manager

export async function returnTaskAction(
  taskId: string,
  reason: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  if (!reason.trim()) return { error: "سبب الإرجاع مطلوب" };

  const role = context.employee.role;
  const isManager = role === "super_admin" || role === "track_manager";

  // Check if current employee is the active reviewer
  const { data: reviewer } = await supabase
    .from("task_reviewers")
    .select("id")
    .eq("task_id", taskId)
    .eq("employee_id", context.employee.id)
    .eq("status", "reviewing")
    .maybeSingle();

  if (!reviewer && !isManager)
    return { error: "يجب عليك بدء المراجعة أولاً قبل الإرجاع" };

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_to, team_id")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "المهمة غير موجودة" };
  if (task.status !== "on_hold") return { error: "المهمة ليست بانتظار المراجعة" };

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("tasks")
    .update({ status: "in_progress", updated_at: now })
    .eq("id", taskId);
  if (updateErr) return { error: updateErr.message };

  // Mark reviewer record as returned (if exists)
  if (reviewer) {
    await supabase
      .from("task_reviewers")
      .update({ status: "returned", completed_at: now, notes: reason.trim() })
      .eq("id", reviewer.id);
  } else if (isManager) {
    await supabase.from("task_reviewers").insert({
      task_id: taskId,
      employee_id: context.employee.id,
      status: "returned",
      started_at: now,
      completed_at: now,
      notes: reason.trim(),
    });
  }

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: "task_returned",
    description: `أعاد ${context.employee.full_name} المهمة للتنفيذ — السبب: ${reason.trim()}`,
  });

  const recipients = await collectTaskRecipients(
    supabase, taskId, task.assigned_to, context.employee.id
  );
  if (recipients.length > 0) {
    await supabase.from("notifications").insert(
      recipients.map((id) => ({
        recipient_id: id,
        type: "task_updated" as const,
        title: "تم إرجاع المهمة للتنفيذ",
        body: `أعاد ${context.employee.full_name} مهمة "${task.title}" للتنفيذ — السبب: ${reason.trim()}`,
        sender_id: context.employee.id,
        data: { task_id: taskId },
      }))
    );
  }

  revalidatePath("/dashboard/assignments");
  revalidatePath(`/dashboard/assignments/${taskId}`);
  revalidatePath("/dashboard/my-tasks");
  revalidatePath("/dashboard");
  return { error: null };
}

// ─── Allowed status transitions for the assignee ──────────────────────────────
// on_hold is now "awaiting review" — only managers can move tasks out of it
const ALLOWED_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  in_progress: ["on_hold", "pending"],
  pending: ["in_progress", "on_hold"],
  on_hold: [],
};

export async function updateMyTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_to, created_by, team_id")
    .eq("id", taskId)
    .eq("assigned_to", context.employee.id)
    .single();

  if (!task) return { error: "المهمة غير موجودة أو لم تُسند إليك" };

  const allowed = ALLOWED_TRANSITIONS[task.status as TaskStatus] ?? [];
  if (!allowed.includes(newStatus)) return { error: "الانتقال غير مسموح به" };

  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("tasks")
    .update(
      newStatus === "completed"
        ? { status: newStatus, updated_at: now, completed_at: now }
        : { status: newStatus, updated_at: now }
    )
    .eq("id", taskId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("task_activity").insert({
    task_id: taskId,
    employee_id: context.employee.id,
    event_type: `status_${newStatus}`,
    description: `غيّر ${context.employee.full_name} حالة المهمة إلى ${TASK_STATUS_LABELS[newStatus]}`,
  });

  // Build recipient list: creator + team track_manager
  const recipientSet = new Set<string>();
  if (task.created_by && task.created_by !== context.employee.id) {
    recipientSet.add(task.created_by);
  }
  if (task.team_id) {
    const { data: mgrs } = await supabase
      .from("employees")
      .select("id")
      .eq("team_id", task.team_id)
      .eq("role", "track_manager")
      .eq("is_active", true);
    ((mgrs ?? []) as Array<{ id: string }>).forEach((m) => recipientSet.add(m.id));
  }

  notifyTaskStatusChanged(supabase, {
    taskId,
    taskTitle: task.title,
    newStatus,
    actorId: context.employee.id,
    actorName: context.employee.full_name,
    recipientIds: Array.from(recipientSet),
  }).catch(() => {});

  revalidatePath("/dashboard/my-tasks");
  revalidatePath(`/dashboard/assignments/${taskId}`);
  revalidatePath("/dashboard");
  return { error: null };
}
