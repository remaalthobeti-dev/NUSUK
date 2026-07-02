import { requireAuthenticated } from "@/lib/auth/guards";
import type { AvailabilityStatus } from "@/types/database";

export interface TeamDirectoryEntry {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  color: string;
  icon: string | null;
  employeeCount: number;
  presentCount: number;
  availableCount: number;
}

export async function getTeamsDirectory(): Promise<{
  teams: TeamDirectoryEntry[];
  error: string | null;
}> {
  const { supabase, error } = await requireAuthenticated();
  if (error) return { teams: [], error };

  const [teamsRes, employeesRes, presenceRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, name_en, description, color, icon")
      .eq("is_active", true)
      .order("name"),
    supabase.from("employees").select("id, team_id").eq("is_active", true),
    supabase
      .from("employee_presence")
      .select("employee_id, availability_status"),
  ]);

  if (teamsRes.error) return { teams: [], error: teamsRes.error.message };

  const rawTeams = teamsRes.data ?? [];
  const employees = employeesRes.data ?? [];
  const presences = presenceRes.data ?? [];

  const presenceMap = new Map(presences.map((p) => [p.employee_id, p.availability_status as AvailabilityStatus]));

  const teams: TeamDirectoryEntry[] = rawTeams.map((t) => {
    const teamEmps = employees.filter((e) => e.team_id === t.id);
    let presentCount = 0;
    let availableCount = 0;
    for (const emp of teamEmps) {
      const status = presenceMap.get(emp.id);
      if (status && status !== "offline") presentCount++;
      if (status === "available") availableCount++;
    }
    return {
      id: t.id,
      name: t.name,
      name_en: t.name_en,
      description: t.description,
      color: t.color,
      icon: t.icon,
      employeeCount: teamEmps.length,
      presentCount,
      availableCount,
    };
  });

  return { teams, error: null };
}
