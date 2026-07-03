import { requireAuthenticated } from "@/lib/auth/guards";
import type { Task, TaskPriority, TaskRequestType, TaskRequestStatus } from "@/types/database";

// ─── Joined shapes ────────────────────────────────────────────────────────────

export interface TaskDetailTask extends Task {
  creator: { full_name: string } | null;
  assignee: { full_name: string } | null;
  team: { name: string } | null;
}

export interface TaskParticipantEntry {
  id: string;
  employee_id: string;
  joined_at: string;
  left_at: string | null;
  employee: { full_name: string; job_title: string | null } | null;
}

export interface TaskCommentEntry {
  id: string;
  comment: string;
  created_at: string;
  employee_id: string;
  employee: { full_name: string } | null;
}

export interface TaskActivityEntry {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  employee: { full_name: string } | null;
}

export interface TaskRequestEntry {
  id: string;
  request_type: TaskRequestType;
  status: TaskRequestStatus;
  created_at: string;
  requester: { id: string; full_name: string } | null;
  requestee: { id: string; full_name: string } | null;
}

export interface TaskReviewerEntry {
  id: string;
  employee_id: string;
  status: "reviewing" | "approved" | "returned";
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  employee: { full_name: string; job_title?: string | null } | null;
}

export interface TeamMemberSummary {
  id: string;
  full_name: string;
  job_title: string | null;
}

export interface TaskDetailData {
  task: TaskDetailTask;
  participants: TaskParticipantEntry[];
  comments: TaskCommentEntry[];
  activity: TaskActivityEntry[];
  pendingRequests: TaskRequestEntry[];
  reviewers: TaskReviewerEntry[];
  teamMembers: TeamMemberSummary[];
  currentEmployeeId: string;
  currentEmployeeRole: string;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getTaskDetail(
  taskId: string
): Promise<{ data: TaskDetailData | null; error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { data: null, error };

  const teamId = context.employee.team_id;
  if (!teamId) return { data: null, error: "لا تنتمي إلى فريق" };

  // Fetch task — team isolation enforced here
  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select(
      `*, creator:employees!tasks_created_by_fkey(full_name), assignee:employees!tasks_assigned_to_fkey(full_name), team:teams!tasks_team_id_fkey(name)`
    )
    .eq("id", taskId)
    .eq("team_id", teamId)
    .single();

  if (taskErr || !task) return { data: null, error: "المهمة غير موجودة أو لا تنتمي إلى فريقك" };

  // Fetch all remaining data in parallel
  const [participantsRes, commentsRes, activityRes, requestsRes, reviewersRes, membersRes] =
    await Promise.all([
      supabase
        .from("task_participants")
        .select(
          `id, employee_id, joined_at, left_at, employee:employees!task_participants_employee_id_fkey(full_name, job_title)`
        )
        .eq("task_id", taskId)
        .is("left_at", null)
        .order("joined_at", { ascending: true }),

      supabase
        .from("task_comments")
        .select(
          `id, comment, created_at, employee_id, employee:employees!task_comments_employee_id_fkey(full_name)`
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),

      supabase
        .from("task_activity")
        .select(
          `id, event_type, description, created_at, employee:employees!task_activity_employee_id_fkey(full_name)`
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),

      supabase
        .from("task_requests")
        .select(
          `id, request_type, status, created_at, requester:employees!task_requests_requester_id_fkey(id, full_name), requestee:employees!task_requests_requestee_id_fkey(id, full_name)`
        )
        .eq("task_id", taskId)
        .eq("status", "pending"),

      supabase
        .from("task_reviewers")
        .select(
          `id, employee_id, status, started_at, completed_at, notes, employee:employees!task_reviewers_employee_id_fkey(full_name, job_title)`
        )
        .eq("task_id", taskId)
        .order("started_at", { ascending: false }),

      supabase
        .from("employees")
        .select("id, full_name, job_title")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("full_name"),
    ]);

  return {
    data: {
      task: task as unknown as TaskDetailTask,
      participants: (participantsRes.data ?? []) as unknown as TaskParticipantEntry[],
      comments: (commentsRes.data ?? []) as unknown as TaskCommentEntry[],
      activity: (activityRes.data ?? []) as unknown as TaskActivityEntry[],
      pendingRequests: (requestsRes.data ?? []) as unknown as TaskRequestEntry[],
      reviewers: (reviewersRes.data ?? []) as unknown as TaskReviewerEntry[],
      teamMembers: (membersRes.data ?? []) as TeamMemberSummary[],
      currentEmployeeId: context.employee.id,
      currentEmployeeRole: context.employee.role,
    },
    error: null,
  };
}
