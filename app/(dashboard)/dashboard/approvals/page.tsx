import type { Metadata } from "next";
import { assertSuperAdmin } from "@/lib/auth/guards";
import { getAllRequests, getTeamsForApprovals } from "@/lib/data/approvals";
import { ApprovalsDashboard } from "@/components/approvals/approvals-dashboard";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "مركز الموافقات — نسك" };

export default async function ApprovalsPage() {
  await assertSuperAdmin();

  let requests: Awaited<ReturnType<typeof getAllRequests>> = [];
  let teams: Awaited<ReturnType<typeof getTeamsForApprovals>> = [];
  try {
    [requests, teams] = await Promise.all([getAllRequests(), getTeamsForApprovals()]);
  } catch { /* data stays empty */ }

  return (
    <>
      <PageHeader
        title="مركز الموافقات"
        description="مراجعة واعتماد طلبات تسجيل المستخدمين الجدد"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "مركز الموافقات" },
        ]}
      />
      <ApprovalsDashboard requests={requests} teams={teams} />
    </>
  );
}
