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

    // Use optional chaining on the response so a malformed SDK response never
    // throws "Cannot destructure property 'user' of null/undefined".
    const getUserResult = await supabase.auth.getUser();
    const user = getUserResult.data?.user ?? null;

    if (!user) {
      // No authenticated session → send to login.
      // This is safe: an unauthenticated user at /login will NOT be bounced
      // back by middleware (the bounce only applies to authenticated users).
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
        // No active employee — check the registration request status.
        // Guard against the table not existing (migration 002 not yet applied):
        // any error code other than PGRST116 ("zero rows") indicates an infra
        // issue, and we fall through to /pending-approval rather than /login.
        //
        // IMPORTANT: we must NOT redirect an authenticated user to /login here.
        // Middleware will bounce authenticated users from /login → /dashboard,
        // creating an infinite redirect loop.  /pending-approval is the correct
        // fallback for an authenticated user with no active employee record.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: reqData, error: reqError } = await (supabase as any)
          .from("registration_requests")
          .select("status")
          .eq("auth_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const req = reqData as { status: string } | null;

        if (reqError && reqError.code !== "PGRST116") {
          // Table missing or unexpected DB error — default to pending-approval.
          // The user is authenticated; /pending-approval will show them a safe
          // waiting screen without creating a redirect loop.
          redirectTo = "/pending-approval";
        } else {
          redirectTo = req?.status === "rejected" ? "/rejected" : "/pending-approval";
        }
      }
    }
  } catch (err) {
    // Let Next.js internal signals (DYNAMIC_SERVER_USAGE, NEXT_REDIRECT,
    // NEXT_NOT_FOUND) propagate so the framework can handle them correctly.
    // These are thrown by cookies(), redirect(), and notFound() respectively.
    const digest = (err as { digest?: string }).digest;
    if (
      digest === "DYNAMIC_SERVER_USAGE" ||
      digest === "NEXT_NOT_FOUND" ||
      (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    // For all other errors (network failure, unexpected SDK error), redirect to
    // /pending-approval rather than /login.  An authenticated user at /login
    // would be immediately bounced back to /dashboard by middleware, creating
    // an infinite loop.  /pending-approval is auth-protected and loop-free.
    console.error("[dashboard/layout] unexpected error:", (err as Error)?.message);
    redirectTo = "/pending-approval";
  }

  // Call redirect() outside try-catch — it throws a special Next.js error
  // that must propagate to the framework without being caught by user code.
  if (redirectTo) {
    redirect(redirectTo);
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
