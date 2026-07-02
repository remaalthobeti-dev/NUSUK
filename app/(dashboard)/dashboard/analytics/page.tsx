import type { Metadata } from "next";
import { assertManager } from "@/lib/auth/guards";
import { getAnalyticsData } from "@/lib/data/admin";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "التحليلات — نسك" };

export default async function AnalyticsPage() {
  await assertManager();
  let data;
  try {
    data = await getAnalyticsData();
  } catch {
    data = { completedToday: 0, activeTasksCount: 0, avgTaskDurationHours: 0, mostActiveEmployee: null, employeeWorkloads: [], teamWorkloads: [], taskStatusCounts: [], completionsByTeam: [] };
  }

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
