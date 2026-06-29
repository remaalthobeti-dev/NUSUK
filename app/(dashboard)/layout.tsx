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

    console.log(`[dashboard/layout] user=${user?.id ?? "none"}`);

    if (!user) {
      redirectTo = "/login";
    } else {
      // Check for an approved, active employee record
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("id, is_active")
        .eq("user_id", user.id)
        .single();

      const employee = empData as { id: string; is_active: boolean } | null;
      console.log(`[dashboard/layout] employee=${employee?.id ?? "none"} is_active=${employee?.is_active} empError=${empError?.code}`);

      if (!employee || !employee.is_active) {
        // No active employee — check the registration request status.
        // Guard against the table not existing (migration not yet applied).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: reqData, error: reqError } = await (supabase as any)
          .from("registration_requests")
          .select("status")
          .eq("auth_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const req = reqData as { status: string } | null;
        console.log(`[dashboard/layout] req=${req?.status ?? "none"} reqError=${reqError?.code}`);

        // If the table doesn't exist yet (42P01) or any DB error, fall through to /login
        // rather than incorrectly showing the pending/rejected screen.
        if (reqError && reqError.code !== "PGRST116") {
          // PGRST116 = "no rows" — that's expected; anything else is an infra issue
          console.log(`[dashboard/layout] registration_requests query failed (${reqError.code}) → redirect /login`);
          redirectTo = "/login";
        } else {
          redirectTo = req?.status === "rejected" ? "/rejected" : "/pending-approval";
        }
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
