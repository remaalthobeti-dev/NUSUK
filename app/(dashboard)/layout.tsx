import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve auth state outside try-catch so redirect() throws are never caught.
  let redirectTo: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirectTo = "/login";
    } else {
      // Check for an approved, active employee record
      const { data: empData } = await supabase
        .from("employees")
        .select("id, is_active")
        .eq("user_id", user.id)
        .single();

      const employee = empData as { id: string; is_active: boolean } | null;

      if (!employee || !employee.is_active) {
        // No active employee — check the registration request status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: reqData } = await (supabase as any)
          .from("registration_requests")
          .select("status")
          .eq("auth_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const req = reqData as { status: string } | null;
        redirectTo = req?.status === "rejected" ? "/rejected" : "/pending-approval";
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Missing Supabase")) {
      redirect("/login?error=config");
    }
    throw err;
  }

  // Call redirect() outside try-catch — it throws a special Next.js error
  // that must propagate to the framework without being caught by user code.
  if (redirectTo) {
    redirect(redirectTo);
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
