import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/home/home-client";
import type { LatestCircular } from "@/components/home/home-client";
import { getTodaysMeetings } from "@/lib/data/meetings";
import type { AvailabilityStatus, UserRole, Team } from "@/types/database";

export const metadata: Metadata = { title: "الرئيسية — نسك" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout handles redirect

  const { data: emp } = await supabase
    .from("employees")
    .select("id, full_name, role, team_id")
    .eq("user_id", user.id)
    .single();
  if (!emp) return null;

  const { data: presence } = await supabase
    .from("employee_presence")
    .select("availability_status")
    .eq("employee_id", emp.id)
    .single();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, completed_at")
    .eq("assigned_to", emp.id)
    .neq("status", "cancelled");

  const taskList = tasks ?? [];
  const taskCounts = {
    assigned: taskList.length,
    pending: taskList.filter(
      (t) =>
        t.status === "pending" ||
        t.status === "in_progress" ||
        t.status === "on_hold"
    ).length,
    completedToday: taskList.filter(
      (t) =>
        t.status === "completed" &&
        t.completed_at != null &&
        new Date(t.completed_at) >= todayStart
    ).length,
  };

  const [{ count: unreadCount }, todaysMeetings, teamsRes, latestCircularRes, unreadCircularsRes] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", emp.id)
        .eq("is_read", false),
      getTodaysMeetings(),
      supabase.from("teams").select("*").eq("is_active", true).order("name"),
      // Latest circular for this employee (system notification with is_circular: true)
      supabase
        .from("notifications")
        .select("id, title, body, created_at, is_read")
        .eq("recipient_id", emp.id)
        .eq("type", "system")
        .order("created_at", { ascending: false })
        .limit(20),
      // Unread circulars count
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", emp.id)
        .eq("type", "system")
        .eq("is_read", false),
    ]);

  const teams = (teamsRes.data as Team[] | null) ?? [];

  // Filter to only circulars (data->is_circular == true)
  const allSystemNotifs = (latestCircularRes.data ?? []) as Array<{
    id: string; title: string; body: string | null; created_at: string; is_read: boolean;
  }>;

  // We need data field too to filter — re-query with data
  const { data: circularRows } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, is_read, data")
    .eq("recipient_id", emp.id)
    .eq("type", "system")
    .order("created_at", { ascending: false })
    .limit(50);

  const circulars = (circularRows ?? []).filter(
    (n) => n.data && typeof n.data === "object" && (n.data as Record<string, unknown>).is_circular === true
  );

  const latestCircular: LatestCircular | null = circulars[0]
    ? {
        id: circulars[0].id,
        title: circulars[0].title,
        body: circulars[0].body,
        created_at: circulars[0].created_at,
        is_read: circulars[0].is_read,
      }
    : null;

  const unreadCirculars = circulars.filter((n) => !n.is_read).length;

  return (
    <HomeClient
      employeeName={emp.full_name}
      role={emp.role as UserRole}
      employeeTeamId={emp.team_id}
      teams={teams}
      currentStatus={
        (presence?.availability_status ?? "available") as AvailabilityStatus
      }
      taskCounts={taskCounts}
      unreadNotifications={unreadCount ?? 0}
      todaysMeetings={todaysMeetings}
      latestCircular={latestCircular}
      unreadCirculars={unreadCirculars}
    />
  );
}
