import type { Metadata } from "next";
import { getTeamsForSettings, getEmployeesForSettings } from "@/lib/data/admin";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الإعدادات — نسك" };

export default async function SettingsPage() {
  const [teams, employees] = await Promise.all([
    getTeamsForSettings(),
    getEmployeesForSettings(),
  ]);

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
