import { requireAuthenticated } from "@/lib/auth/guards";
import type { DistributionRequest, DistributionPageRole, DistributionPageData } from "@/types/distribution";

export async function getCorporatePageData(): Promise<DistributionPageData> {
  const { supabase, context, error } = await requireAuthenticated();

  if (error) {
    return { companies: [], requests: [], pageRole: "corporate", employeeId: "", employeeName: "", error };
  }

  let pageRole: DistributionPageRole = "corporate";

  if (context.role === "super_admin" || context.role === "track_manager") {
    pageRole = "admin";
  } else if (context.employee.team_id) {
    const { data: config } = await supabase
      .from("distribution_team_configs")
      .select("page_role")
      .eq("team_id", context.employee.team_id)
      .maybeSingle();

    if (config?.page_role === "distribution") {
      // Distribution team cannot access corporate page
      return {
        companies: [],
        requests: [],
        pageRole: "distribution",
        employeeId: context.employee.id,
        employeeName: context.employee.full_name,
        error: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
      };
    }
    if (config?.page_role === "corporate") {
      pageRole = "corporate";
    }
  }

  const { data: requests, error: reqErr } = await supabase
    .from("distribution_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return {
    companies: [],
    requests: (requests ?? []) as DistributionRequest[],
    pageRole,
    employeeId: context.employee.id,
    employeeName: context.employee.full_name,
    error: reqErr?.message ?? null,
  };
}
