import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { MeetingsClient } from "@/components/meetings/meetings-client";
import { getVisibleMeetings } from "@/lib/data/meetings";
import type { Team, UserRole } from "@/types/database";

export const metadata: Metadata = { title: "الاجتماعات — نسك" };

export default async function MeetingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role, team_id")
    .eq("user_id", user.id)
    .single();
  if (!emp) return null;

  const [meetings, teamsRes] = await Promise.all([
    getVisibleMeetings(),
    supabase.from("teams").select("*").eq("is_active", true).order("name"),
  ]);

  const teams = (teamsRes.data as Team[] | null) ?? [];
  const canCreate = emp.role === "super_admin" || emp.role === "track_manager";

  return (
    <>
      <PageHeader
        title="الاجتماعات"
        description="جميع الاجتماعات المجدولة وإدارتها"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الاجتماعات" },
        ]}
      />
      <MeetingsClient
        meetings={meetings}
        currentEmployeeId={emp.id}
        role={emp.role as UserRole}
        employeeTeamId={emp.team_id}
        teams={teams}
        canCreate={canCreate}
      />
    </>
  );
}
