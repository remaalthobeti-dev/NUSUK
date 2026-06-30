import type { Metadata } from "next";
import { assertSuperAdmin } from "@/lib/auth/guards";
import { getAllRequests, getTeamsForApprovals } from "@/lib/data/approvals";
import { ApprovalsDashboard } from "@/components/approvals/approvals-dashboard";

export const metadata: Metadata = { title: "مركز الموافقات" };

export default async function ApprovalsPage() {
  await assertSuperAdmin();

  let requests: Awaited<ReturnType<typeof getAllRequests>> = [];
  let teams: Awaited<ReturnType<typeof getTeamsForApprovals>> = [];
  try {
    [requests, teams] = await Promise.all([getAllRequests(), getTeamsForApprovals()]);
  } catch { /* data stays empty */ }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مركز الموافقات</h1>
        <p className="text-muted-foreground text-sm mt-1">
          إدارة طلبات تسجيل المستخدمين الجدد
        </p>
      </div>
      <ApprovalsDashboard requests={requests} teams={teams} />
    </div>
  );
}
