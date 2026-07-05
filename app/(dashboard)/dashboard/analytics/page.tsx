import type { Metadata } from "next";
import { assertManager } from "@/lib/auth/guards";
import { getExecutiveAnalyticsData } from "@/lib/data/analytics-executive";
import { ExecutiveClient } from "@/components/analytics/executive-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "التقارير والتحليلات — نسك" };

export default async function AnalyticsPage() {
  await assertManager();

  const data = await getExecutiveAnalyticsData();

  return (
    <>
      <PageHeader
        title="التقارير والتحليلات"
        description="نظرة شاملة على أداء الفرق والمهام"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "التقارير" },
        ]}
      />
      <ExecutiveClient data={data} />
    </>
  );
}
