import type { Metadata } from "next";
import { getTeamsForSettings, getEmployeesForSettings } from "@/lib/data/admin";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الإعدادات — نسك" };

export default async function SettingsPage() {
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
