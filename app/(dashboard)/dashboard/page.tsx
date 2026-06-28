import type { Metadata } from "next";
import { getAdminOverview } from "@/lib/data/admin";
import { AdminOverview } from "@/components/admin/admin-overview";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "لوحة التحكم — نسك" };

export default async function AdminDashboardPage() {
  const data = await getAdminOverview();

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
