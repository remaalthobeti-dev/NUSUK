import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllRequests, getTeamsForApprovals } from "@/lib/data/approvals";
import { ApprovalsDashboard } from "@/components/approvals/approvals-dashboard";

export const metadata: Metadata = { title: "مركز الموافقات" };

export default async function ApprovalsPage() {
  let redirectTo: string | null = null;
  let requests: Awaited<ReturnType<typeof getAllRequests>> = [];
  let teams: Awaited<ReturnType<typeof getTeamsForApprovals>> = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirectTo = "/login"; }
    else {
      const { data: empData } = await supabase
        .from("employees")
        .select("role")
        .eq("user_id", user.id)
        .single();
      const emp = empData as { role: string } | null;
      if (!emp || emp.role !== "super_admin") { redirectTo = "/dashboard"; }
      else {
        [requests, teams] = await Promise.all([getAllRequests(), getTeamsForApprovals()]);
      }
    }
  } catch (err) {
    const digest = (err as { digest?: string }).digest;
    if (digest === "DYNAMIC_SERVER_USAGE" || (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT"))) throw err;
    console.error("[approvals/page]", err);
    redirectTo = "/dashboard";
  }

  if (redirectTo) redirect(redirectTo);

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
