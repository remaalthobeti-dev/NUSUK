import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllRequests, getTeamsForApprovals } from "@/lib/data/approvals";
import { ApprovalsDashboard } from "@/components/approvals/approvals-dashboard";

export const metadata: Metadata = { title: "مركز الموافقات" };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: emp } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!emp || (emp as { role: string }).role !== "super_admin") {
    redirect("/dashboard");
  }

  const [requests, teams] = await Promise.all([
    getAllRequests(),
    getTeamsForApprovals(),
  ]);

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
