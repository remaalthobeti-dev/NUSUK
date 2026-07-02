import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AssignmentsClient } from "@/components/assignments/assignments-client";
import {
  getAvailableTasks,
  getRunningTasks,
  getReviewTasks,
} from "@/lib/data/assignments";
import { requireAuthenticated } from "@/lib/auth/guards";
import type { Team, UserRole } from "@/types/database";

export const metadata: Metadata = { title: "إسناد الأعمال — نسك" };

export default async function AssignmentsPage() {
  const { supabase, context, error } = await requireAuthenticated();
  if (error || !supabase) return null;

  const role = context.employee.role as UserRole;
  const canCreate = role === "super_admin" || role === "track_manager";
  const canManage = role === "super_admin" || role === "track_manager";

  const [available, running, review, teamsRes] = await Promise.all([
    getAvailableTasks(),
    getRunningTasks(),
    canManage ? getReviewTasks() : Promise.resolve({ tasks: [], error: null }),
    supabase.from("teams").select("*").eq("is_active", true).order("name"),
  ]);

  const teams = (teamsRes.data as Team[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="إسناد الأعمال"
        description="أعمال فريقك المتاحة والجارية"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "إسناد الأعمال" },
        ]}
      />
      <AssignmentsClient
        availableTasks={available.tasks}
        runningTasks={running.tasks}
        reviewTasks={review.tasks}
        role={role}
        teams={teams}
        employeeTeamId={context.employee.team_id}
        canCreate={canCreate}
        canManage={canManage}
      />
    </>
  );
}
