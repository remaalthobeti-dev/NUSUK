import type { Metadata } from "next";
import { getAdminOverview, getOperationsKpis } from "@/lib/data/admin";
import { AdminOverview } from "@/components/admin/admin-overview";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "مركز العمليات — نسك" };

export default async function OperationsPage() {
  const [data, kpis] = await Promise.all([
    getAdminOverview().catch(() => ({
      teams: [],
      globalStats: {
        totalEmployees: 0,
        totalPresent: 0,
        byStatus: { available: 0, busy: 0, in_meeting: 0, field_work: 0, remote: 0, offline: 0 },
      },
    })),
    getOperationsKpis().catch(() => ({
      taskPending: 0, taskInProgress: 0, taskOnHold: 0, taskOverdue: 0,
    })),
  ]);

  return (
    <>
      <PageHeader
        title="مركز العمليات"
        description="نظرة شاملة على جميع الفرق وحالات الموظفين في الوقت الفعلي"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "مركز العمليات" },
        ]}
      />
      <AdminOverview data={data} kpis={kpis} />
    </>
  );
}
