import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationType } from "@/types/database";

type SB = SupabaseClient<Database>;

interface NotificationPayload {
  recipient_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  sender_id?: string;
  data?: Record<string, string>;
}

async function sendNotifications(supabase: SB, payloads: NotificationPayload[]) {
  if (payloads.length === 0) return;
  await supabase.from("notifications").insert(
    payloads.map((p) => ({
      recipient_id: p.recipient_id,
      type: p.type,
      title: p.title,
      body: p.body ?? null,
      sender_id: p.sender_id ?? null,
      data: (p.data ?? null) as Record<string, string> | null,
    }))
  );
}

async function getTeamMemberIds(
  supabase: SB,
  teamId: string,
  excludeId?: string
): Promise<string[]> {
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("team_id", teamId)
    .eq("is_active", true);
  const ids = ((data ?? []) as Array<{ id: string }>).map((e) => e.id);
  return excludeId ? ids.filter((id) => id !== excludeId) : ids;
}

export async function notifyTaskCreated(
  supabase: SB,
  opts: {
    taskId: string;
    taskTitle: string;
    teamId: string;
    creatorId: string;
    creatorName: string;
  }
) {
  const recipientIds = await getTeamMemberIds(supabase, opts.teamId, opts.creatorId);
  if (recipientIds.length === 0) return;

  await sendNotifications(
    supabase,
    recipientIds.map((id) => ({
      recipient_id: id,
      type: "task_updated" as NotificationType,
      title: "مهمة جديدة في فريقك",
      body: `أضاف ${opts.creatorName} مهمة جديدة: "${opts.taskTitle}"`,
      sender_id: opts.creatorId,
      data: { task_id: opts.taskId },
    }))
  );
}

export async function notifyTaskClaimed(
  supabase: SB,
  opts: {
    taskId: string;
    taskTitle: string;
    assigneeId: string;
    assigneeName: string;
    createdById: string | null;
  }
) {
  if (!opts.createdById || opts.createdById === opts.assigneeId) return;

  await sendNotifications(supabase, [
    {
      recipient_id: opts.createdById,
      type: "task_assigned",
      title: "تم استلام مهمتك",
      body: `استلم ${opts.assigneeName} مهمة "${opts.taskTitle}"`,
      sender_id: opts.assigneeId,
      data: { task_id: opts.taskId },
    },
  ]);
}

export async function notifyTaskStatusChanged(
  supabase: SB,
  opts: {
    taskId: string;
    taskTitle: string;
    newStatus: string;
    actorId: string;
    actorName: string;
    recipientIds: string[];
  }
) {
  const targets = opts.recipientIds.filter((id) => id !== opts.actorId);
  if (targets.length === 0) return;

  const STATUS_LABELS: Record<string, string> = {
    in_progress: "جارية",
    completed: "مكتملة",
    on_hold: "موقوفة",
    cancelled: "ملغية",
    pending: "معلقة",
    available: "متاحة",
  };

  const label = STATUS_LABELS[opts.newStatus] ?? opts.newStatus;
  const type: NotificationType =
    opts.newStatus === "completed" ? "task_completed" : "task_updated";

  await sendNotifications(
    supabase,
    targets.map((id) => ({
      recipient_id: id,
      type,
      title: "تحديث حالة المهمة",
      body: `غيّر ${opts.actorName} حالة "${opts.taskTitle}" إلى ${label}`,
      sender_id: opts.actorId,
      data: { task_id: opts.taskId },
    }))
  );
}

export async function notifyCommentAdded(
  supabase: SB,
  opts: {
    taskId: string;
    taskTitle: string;
    commenterId: string;
    commenterName: string;
    recipientIds: string[];
    commentPreview: string;
  }
) {
  const targets = opts.recipientIds.filter((id) => id !== opts.commenterId);
  if (targets.length === 0) return;

  await sendNotifications(
    supabase,
    targets.map((id) => ({
      recipient_id: id,
      type: "comment_added" as NotificationType,
      title: "تعليق جديد على مهمة",
      body: `علّق ${opts.commenterName} على "${opts.taskTitle}": ${opts.commentPreview.slice(0, 60)}`,
      sender_id: opts.commenterId,
      data: { task_id: opts.taskId },
    }))
  );
}
