import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // Check if user has an approved employee record
    const { data: employeeData } = await supabase
      .from("employees")
      .select("id, is_active")
      .eq("user_id", user.id)
      .single();

    const employee = employeeData as { id: string; is_active: boolean } | null;

    if (!employee || !employee.is_active) {
      // Check registration request status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requestData } = await (supabase as any)
        .from("registration_requests")
        .select("status")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const request = requestData as { status: string } | null;

      if (request?.status === "rejected") {
        redirect("/rejected");
      }
      redirect("/pending-approval");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Missing Supabase")) {
      redirect("/login?error=config");
    }
    throw err;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
