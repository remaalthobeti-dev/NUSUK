import type { Metadata } from "next";
import { assertManager } from "@/lib/auth/guards";
import { getExecutiveAnalyticsData } from "@/lib/data/analytics-executive";
import { ExecutiveClient } from "@/components/analytics/executive-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "التحليلات التنفيذية — نسك" };

export default async function AnalyticsPage() {
  await assertManager();

  const data = await getExecutiveAnalyticsData();

  return (
    <>
      <PageHeader
        title="التحليلات التنفيذية"
        description="لوحة أداء حية — KPIs · عبء العمل · توزيع المهام · تنبيهات فورية"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "التحليلات" },
        ]}
      />
      <ExecutiveClient data={data} />
    </>
  );
}
