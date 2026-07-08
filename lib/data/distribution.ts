import { requireAuthenticated } from "@/lib/auth/guards";
import type {
  DistributionCompany,
  DistributionRequest,
  DistributionPageRole,
  DistributionPageData,
} from "@/types/distribution";

export async function getDistributionPageData(): Promise<DistributionPageData> {
  const { supabase, context, error } = await requireAuthenticated();

  if (error) {
    return {
      companies: [],
      requests: [],
      pageRole: "distribution",
      employeeId: "",
      employeeName: "",
      error,
    };
  }

  // Determine page role
  let pageRole: DistributionPageRole = "distribution";

  if (context.role === "super_admin" || context.role === "track_manager") {
    pageRole = "admin";
  } else if (context.employee.team_id) {
    const { data: config } = await supabase
      .from("distribution_team_configs")
      .select("page_role")
      .eq("team_id", context.employee.team_id)
      .maybeSingle();

    if (config?.page_role === "corporate") {
      pageRole = "corporate";
    } else if (config?.page_role === "distribution") {
      pageRole = "distribution";
    }
  }

  // Fetch companies
  const { data: companies, error: compErr } = await supabase
    .from("distribution_companies")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Fetch requests (latest 300)
  const { data: requests, error: reqErr } = await supabase
    .from("distribution_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return {
    companies: (companies ?? []) as DistributionCompany[],
    requests: (requests ?? []) as DistributionRequest[],
    pageRole,
    employeeId: context.employee.id,
    employeeName: context.employee.full_name,
    error: compErr?.message ?? reqErr?.message ?? null,
  };
}
