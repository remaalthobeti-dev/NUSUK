import type { Metadata } from "next";
import { getAnalyticsData } from "@/lib/data/admin";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "التحليلات — نسك" };

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <>
      <PageHeader
        title="التحليلات والتقارير"
        description="مؤشرات الأداء الرئيسية وتحليل عبء العمل وإنجاز المهام"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "التحليلات" },
        ]}
      />
      <AnalyticsDashboard data={data} />
    </>
  );
}
