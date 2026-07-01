import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/home/home-client";
import { getTodaysMeetings } from "@/lib/data/meetings";
import type { AvailabilityStatus, UserRole } from "@/types/database";

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

  const [{ count: unreadCount }, todaysMeetings] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", emp.id)
      .eq("is_read", false),
    getTodaysMeetings(),
  ]);

  return (
    <HomeClient
      employeeName={emp.full_name}
      role={emp.role as UserRole}
      currentStatus={
        (presence?.availability_status ?? "available") as AvailabilityStatus
      }
      taskCounts={taskCounts}
      unreadNotifications={unreadCount ?? 0}
      todaysMeetings={todaysMeetings}
    />
  );
}
