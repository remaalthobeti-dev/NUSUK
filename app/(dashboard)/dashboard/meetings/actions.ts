"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated } from "@/lib/auth/guards";
import type { MeetingType, MeetingPriority, RsvpResponse } from "@/types/database";

function revalidateMeetings(id?: string) {
  revalidatePath("/dashboard/meetings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/operations");
  if (id) revalidatePath(`/dashboard/meetings/${id}`);
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  meeting_type: MeetingType;
  priority: MeetingPriority;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_link?: string;
  team_id?: string;
  cross_team_ids?: string[];
}

export async function createMeetingAction(
  payload: CreateMeetingPayload
): Promise<{ error: string | null; id?: string }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const role = context.employee.role;
  const empId = context.employee.id;

  if (role === "team_member") return { error: "ليس لديك صلاحية إنشاء اجتماعات" };

  // Track manager creating team meeting: team_id must be their own
  if (role === "track_manager" && payload.meeting_type === "team") {
    payload.team_id = context.employee.team_id ?? undefined;
  }

  // Track manager creating cross_team: their team must be included
  if (role === "track_manager" && payload.meeting_type === "cross_team") {
    const myTeam = context.employee.team_id;
    if (!myTeam) return { error: "لا تنتمي إلى فريق" };
    const ids = payload.cross_team_ids ?? [];
    if (!ids.includes(myTeam)) payload.cross_team_ids = [...ids, myTeam];
  }

  const { data: meeting, error: insertErr } = await supabase
    .from("meetings")
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      meeting_type: payload.meeting_type,
      priority: payload.priority,
      organizer_id: empId,
      created_by: empId,
      team_id: payload.meeting_type === "team" ? (payload.team_id ?? null) : null,
      start_time: payload.start_time,
      end_time: payload.end_time,
      location: payload.location?.trim() || null,
      meeting_link: payload.meeting_link?.trim() || null,
    })
    .select("id")
    .single();

  if (insertErr || !meeting) return { error: insertErr?.message ?? "فشل إنشاء الاجتماع" };

  if (payload.meeting_type === "cross_team" && payload.cross_team_ids?.length) {
    const rows = payload.cross_team_ids.map((teamId) => ({
      meeting_id: meeting.id,
      team_id: teamId,
      organizer_id: empId,
    }));
    await supabase.from("meeting_teams").insert(rows);
  }

  revalidateMeetings(meeting.id);
  return { error: null, id: meeting.id };
}

export async function startMeetingAction(
  meetingId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("organizer_id, status")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "الاجتماع غير موجود" };
  if (meeting.status !== "scheduled") return { error: "يمكن بدء الاجتماعات المجدولة فقط" };

  if (
    context.employee.role !== "super_admin" &&
    meeting.organizer_id !== context.employee.id
  ) {
    return { error: "ليس لديك صلاحية بدء هذا الاجتماع" };
  }

  const { error: updateErr } = await supabase
    .from("meetings")
    .update({ status: "in_progress" })
    .eq("id", meetingId);

  if (updateErr) return { error: updateErr.message };

  revalidateMeetings(meetingId);
  return { error: null };
}

export async function endMeetingAction(
  meetingId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("organizer_id, status")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "الاجتماع غير موجود" };
  if (meeting.status !== "in_progress") return { error: "يمكن إنهاء الاجتماعات الجارية فقط" };

  if (
    context.employee.role !== "super_admin" &&
    meeting.organizer_id !== context.employee.id
  ) {
    return { error: "ليس لديك صلاحية إنهاء هذا الاجتماع" };
  }

  const { error: updateErr } = await supabase
    .from("meetings")
    .update({ status: "completed" })
    .eq("id", meetingId);

  if (updateErr) return { error: updateErr.message };

  revalidateMeetings(meetingId);
  return { error: null };
}

export async function cancelMeetingAction(
  meetingId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("organizer_id, status")
    .eq("id", meetingId)
    .single();

  if (!meeting) return { error: "الاجتماع غير موجود" };
  if (meeting.status === "cancelled") return { error: "الاجتماع ملغى بالفعل" };
  if (meeting.status === "completed") return { error: "لا يمكن إلغاء اجتماع مكتمل" };

  if (
    context.employee.role !== "super_admin" &&
    meeting.organizer_id !== context.employee.id
  ) {
    return { error: "ليس لديك صلاحية إلغاء هذا الاجتماع" };
  }

  const { error: updateErr } = await supabase
    .from("meetings")
    .update({ status: "cancelled" })
    .eq("id", meetingId);

  if (updateErr) return { error: updateErr.message };

  revalidateMeetings(meetingId);
  return { error: null };
}

export async function rsvpAction(
  meetingId: string,
  response: RsvpResponse
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { error: upsertErr } = await supabase
    .from("meeting_rsvps")
    .upsert(
      {
        meeting_id: meetingId,
        employee_id: context.employee.id,
        response,
        responded_at: new Date().toISOString(),
      },
      { onConflict: "meeting_id,employee_id" }
    );

  if (upsertErr) return { error: upsertErr.message };

  revalidatePath(`/dashboard/meetings/${meetingId}`);
  revalidatePath("/dashboard/meetings");
  return { error: null };
}
