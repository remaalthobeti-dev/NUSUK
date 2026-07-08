import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/home/home-client";
import type { LatestAnnouncement } from "@/components/home/home-client";
import { FactoryHomeClient } from "@/components/home/factory-home-client";
import type { PressureLevel } from "@/components/home/factory-home-client";
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

  // Check if this employee belongs to the factory team
  const { data: factoryConfig } = await supabase
    .from("factory_team_configs")
    .select("team_id")
    .eq("team_id", emp.team_id ?? "")
    .maybeSingle();

  if (factoryConfig) {
    // Factory team: show simplified English dashboard with pressure selector
    const { data: pressureRow } = await supabase
      .from("factory_pressure")
      .select("level, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <FactoryHomeClient
        employeeName={emp.full_name}
        currentPressure={pressureRow ? { level: pressureRow.level as PressureLevel, updated_at: pressureRow.updated_at } : null}
      />
    );
  }

  // Fetch factory pressure for non-factory teams to display indicator
  const { data: factoryPressureRow } = await supabase
    .from("factory_pressure")
    .select("level, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const [{ count: unreadCount }, todaysMeetings, teamsRes, announcementRows] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", emp.id)
        .eq("is_read", false),
      getTodaysMeetings(),
      supabase.from("teams").select("*").eq("is_active", true).order("name"),
      // Fetch system notifications with is_announcement flag
      supabase
        .from("notifications")
        .select("id, title, body, created_at, is_read, data")
        .eq("recipient_id", emp.id)
        .eq("type", "system")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const teams = (teamsRes.data as Team[] | null) ?? [];

  // Filter to announcements only (data->is_circular == true, reusing the same flag)
  const announcements = (announcementRows.data ?? []).filter(
    (n) =>
      n.data &&
      typeof n.data === "object" &&
      (n.data as Record<string, unknown>).is_circular === true
  );

  const latestAnnouncement: LatestAnnouncement | null = announcements[0]
    ? {
        id: announcements[0].id,
        title: announcements[0].title,
        body: announcements[0].body,
        created_at: announcements[0].created_at,
        is_read: announcements[0].is_read,
      }
    : null;

  const unreadAnnouncements = announcements.filter((n) => !n.is_read).length;

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
      latestAnnouncement={latestAnnouncement}
      unreadAnnouncements={unreadAnnouncements}
      factoryPressure={factoryPressureRow ? { level: factoryPressureRow.level as PressureLevel, updated_at: factoryPressureRow.updated_at } : null}
    />
  );
}
