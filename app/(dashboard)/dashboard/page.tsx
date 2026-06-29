import type { Metadata } from "next";
import { getAdminOverview } from "@/lib/data/admin";
import { AdminOverview } from "@/components/admin/admin-overview";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "لوحة التحكم — نسك" };

export default async function AdminDashboardPage() {
  let data;
  try {
    data = await getAdminOverview();
  } catch {
    data = { teams: [], globalStats: { totalEmployees: 0, totalPresent: 0, byStatus: { available: 0, busy: 0, in_meeting: 0, field_work: 0, remote: 0, offline: 0 } } };
  }

  return (
    <>
      <PageHeader
        title="لوحة التحكم الرئيسية"
        description="نظرة شاملة على جميع الفرق وحالات الموظفين في الوقت الفعلي"
      />
      <AdminOverview data={data} />
    </>
  );
}
