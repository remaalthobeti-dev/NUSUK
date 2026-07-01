import type { Metadata } from "next";
import { getAdminOverview } from "@/lib/data/admin";
import { getMeetingsHappeningNow, getUpcomingMeetings } from "@/lib/data/meetings";
import { AdminOverview } from "@/components/admin/admin-overview";
import { MeetingsNowSection } from "@/components/meetings/meetings-now-section";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "مركز العمليات — نسك" };

export default async function OperationsPage() {
  const [data, meetingsNow, upcomingMeetings] = await Promise.all([
    getAdminOverview().catch(() => ({
      teams: [],
      globalStats: {
        totalEmployees: 0,
        totalPresent: 0,
        byStatus: {
          available: 0,
          busy: 0,
          in_meeting: 0,
          field_work: 0,
          remote: 0,
          offline: 0,
        },
      },
    })),
    getMeetingsHappeningNow(),
    getUpcomingMeetings(5),
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
      <MeetingsNowSection meetingsNow={meetingsNow} upcomingMeetings={upcomingMeetings} />
      <AdminOverview data={data} />
    </>
  );
}
