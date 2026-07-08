import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAdminOverview, getOperationsKpis } from "@/lib/data/admin";
import { AdminOverview } from "@/components/admin/admin-overview";
import { PageHeader } from "@/components/shared/page-header";
import type { PressureLevel } from "@/components/home/factory-home-client";

export const metadata: Metadata = { title: "مركز العمليات — نسك" };

export default async function OperationsPage() {
  const supabase = await createClient();

  const [data, kpis, pressureRow] = await Promise.all([
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
    supabase
      .from("factory_pressure")
      .select("level, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r) => r.data),
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
      <AdminOverview
        data={data}
        kpis={kpis}
        factoryPressure={pressureRow ? { level: pressureRow.level as PressureLevel, updated_at: pressureRow.updated_at } : null}
      />
    </>
  );
}
