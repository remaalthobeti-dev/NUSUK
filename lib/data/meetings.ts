import { createClient } from "@/lib/supabase/server";
import { sortMeetingsByPriority } from "@/types/database";
import type { MeetingWithDetails } from "@/types/database";

const MEETING_SELECT = `
  *,
  organizer:employees!meetings_organizer_id_fkey(id, full_name, role, team:teams(name)),
  team:teams(id, name, color),
  meeting_teams(team_id, organizer_id, team:teams(id, name, color)),
  rsvps:meeting_rsvps(employee_id, response, responded_at)
` as const;

// Today's range in Asia/Riyadh (UTC+3)
function riyadhTodayRange(): { start: string; end: string } {
  const riyadhOffset = 3 * 60 * 60 * 1000;
  const riyadhNow = new Date(Date.now() + riyadhOffset);
  const dayStartUTC = new Date(
    Date.UTC(riyadhNow.getUTCFullYear(), riyadhNow.getUTCMonth(), riyadhNow.getUTCDate()) -
      riyadhOffset
  );
  return {
    start: dayStartUTC.toISOString(),
    end: new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function getVisibleMeetings(): Promise<MeetingWithDetails[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .order("start_time", { ascending: true });
  return sortMeetingsByPriority((data as MeetingWithDetails[] | null) ?? []);
}

export async function getTodaysMeetings(): Promise<MeetingWithDetails[]> {
  const supabase = await createClient();
  const { start, end } = riyadhTodayRange();
  const { data } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .gte("start_time", start)
    .lt("start_time", end)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });
  return sortMeetingsByPriority((data as MeetingWithDetails[] | null) ?? []);
}

export async function getMeetingById(id: string): Promise<MeetingWithDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("id", id)
    .single();
  return (data as MeetingWithDetails | null) ?? null;
}

export async function getMeetingInviteeCount(meeting: MeetingWithDetails): Promise<number> {
  const supabase = await createClient();

  if (meeting.meeting_type === "organization") {
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    return count ?? 0;
  }

  if (meeting.meeting_type === "team" && meeting.team_id) {
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("team_id", meeting.team_id)
      .eq("is_active", true);
    return count ?? 0;
  }

  if (meeting.meeting_type === "cross_team" && meeting.meeting_teams.length > 0) {
    const teamIds = meeting.meeting_teams.map((mt) => mt.team_id);
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .in("team_id", teamIds)
      .eq("is_active", true);
    return count ?? 0;
  }

  return 0;
}

export async function getMeetingsHappeningNow(): Promise<MeetingWithDetails[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("status", "in_progress")
    .order("start_time", { ascending: true });
  return sortMeetingsByPriority((data as MeetingWithDetails[] | null) ?? []);
}

export async function getUpcomingMeetings(limit = 5): Promise<MeetingWithDetails[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("status", "scheduled")
    .gt("start_time", now)
    .order("start_time", { ascending: true })
    .limit(limit);
  return sortMeetingsByPriority((data as MeetingWithDetails[] | null) ?? []);
}
