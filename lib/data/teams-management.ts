import { requireAuthenticated } from "@/lib/auth/guards";
import type { AvailabilityStatus } from "@/types/database";

export interface TeamStats {
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface TeamWithStats {
  id: string;
  name: string;
  name_en: string | null;
  color: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  memberCount: number;
  presentCount: number;
  availableCount: number;
  stats: TeamStats;
}

export interface TeamsManagementResult {
  teams: TeamWithStats[];
  isSuperAdmin: boolean;
  error: string | null;
}

export async function getTeamsManagement(): Promise<TeamsManagementResult> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { teams: [], isSuperAdmin: false, error };

  const isSuperAdmin = context.employee.role === "super_admin";

  // super_admin sees all; others see only active
  const teamsQuery = supabase
    .from("teams")
    .select("id, name, name_en, color, icon, description, is_active, created_at, updated_at")
    .order("name");

  const [teamsRes, employeesRes, presenceRes, tasksRes] = await Promise.all([
    isSuperAdmin ? teamsQuery : teamsQuery.eq("is_active", true),
    supabase.from("employees").select("id, team_id, is_active"),
    supabase.from("employee_presence").select("employee_id, availability_status"),
    supabase.from("tasks").select("team_id, status"),
  ]);

  if (teamsRes.error) return { teams: [], isSuperAdmin, error: teamsRes.error.message };

  const allEmployees = employeesRes.data ?? [];
  const presences = presenceRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const presenceMap = new Map(
    presences.map((p) => [p.employee_id, p.availability_status as AvailabilityStatus])
  );

  const teams: TeamWithStats[] = (teamsRes.data ?? []).map((t) => {
    const teamEmps = allEmployees.filter((e) => e.team_id === t.id && e.is_active);
    let presentCount = 0;
    let availableCount = 0;
    for (const emp of teamEmps) {
      const status = presenceMap.get(emp.id);
      if (status && status !== "offline") presentCount++;
      if (status === "available") availableCount++;
    }

    const teamTasks = tasks.filter((tk) => tk.team_id === t.id);
    const inProgressTasks = teamTasks.filter((tk) => tk.status === "in_progress").length;
    const completedTasks = teamTasks.filter((tk) => tk.status === "completed").length;
    const totalTasks = teamTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: t.id,
      name: t.name,
      name_en: t.name_en,
      color: t.color,
      icon: t.icon,
      description: t.description,
      is_active: t.is_active,
      created_at: t.created_at,
      updated_at: t.updated_at,
      memberCount: teamEmps.length,
      presentCount,
      availableCount,
      stats: { totalTasks, inProgressTasks, completedTasks, completionRate },
    };
  });

  return { teams, isSuperAdmin, error: null };
}
