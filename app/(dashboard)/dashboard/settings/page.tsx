import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamsForSettings, getEmployeesForSettings } from "@/lib/data/admin";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الإعدادات — نسك" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: emp } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if ((emp as { role: string } | null)?.role !== "super_admin") {
    redirect("/dashboard");
  }

  let teams: Awaited<ReturnType<typeof getTeamsForSettings>> = [];
  let employees: Awaited<ReturnType<typeof getEmployeesForSettings>> = [];
  try {
    [teams, employees] = await Promise.all([
      getTeamsForSettings(),
      getEmployeesForSettings(),
    ]);
  } catch { /* data stays empty */ }

  return (
    <>
      <PageHeader
        title="إعدادات النظام"
        description="إدارة الفرق والموظفين والأدوار وحالات التواجد"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الإعدادات" },
        ]}
      />
      <SettingsDashboard initialTeams={teams} initialEmployees={employees} />
    </>
  );
}
