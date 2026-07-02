import { requireManager } from "@/lib/auth/guards";
import type { AvailabilityStatus, UserRole } from "@/types/database";

export interface EmployeeDirectoryEntry {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  job_title: string | null;
  team_id: string | null;
  teamName: string | null;
  teamColor: string | null;
  availabilityStatus: AvailabilityStatus | null;
  workloadPercent: number;
}

export interface EmployeesDirectoryResult {
  employees: EmployeeDirectoryEntry[];
  viewerTeamId: string | null;
  isSuperAdmin: boolean;
  error: string | null;
}

export async function getEmployeesDirectory(): Promise<EmployeesDirectoryResult> {
  const { supabase, context, error } = await requireManager();
  if (error) return { employees: [], viewerTeamId: null, isSuperAdmin: false, error };

  const isSuperAdmin = context.employee.role === "super_admin";
  const viewerTeamId = context.employee.team_id;

  let empQuery = supabase
    .from("employees")
    .select(`
      id, full_name, email, phone, role, job_title, team_id,
      team:teams!employees_team_id_fkey(name, color)
    `)
    .eq("is_active", true)
    .order("full_name");

  // track_manager only sees their own team
  if (!isSuperAdmin && viewerTeamId) {
    empQuery = empQuery.eq("team_id", viewerTeamId);
  }

  const [empRes, presenceRes] = await Promise.all([
    empQuery,
    supabase.from("employee_presence").select("employee_id, availability_status, workload_percent"),
  ]);

  if (empRes.error) return { employees: [], viewerTeamId, isSuperAdmin, error: empRes.error.message };

  const presenceMap = new Map(
    (presenceRes.data ?? []).map((p) => [
      p.employee_id,
      { status: p.availability_status as AvailabilityStatus, workload: p.workload_percent },
    ])
  );

  const employees: EmployeeDirectoryEntry[] = (empRes.data ?? []).map((emp) => {
    const p = presenceMap.get(emp.id);
    const team = emp.team as { name: string; color: string } | null;
    return {
      id: emp.id,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role as UserRole,
      job_title: emp.job_title,
      team_id: emp.team_id,
      teamName: team?.name ?? null,
      teamColor: team?.color ?? null,
      availabilityStatus: p?.status ?? null,
      workloadPercent: p?.workload ?? 0,
    };
  });

  return { employees, viewerTeamId, isSuperAdmin, error: null };
}
