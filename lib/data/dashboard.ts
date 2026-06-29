import { createClient } from "@/lib/supabase/server";
import type {
  Team,
  Employee,
  Task,
  EmployeePresence,
  EmployeeWithPresence,
  AvailabilityStatus,
} from "@/types/database";

export interface TeamDashboardData {
  team: Team;
  employees: EmployeeWithPresence[];
  presenceSummary: Record<AvailabilityStatus, number>;
  totalPresent: number;
}

export async function getAllTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("created_at");
  return (data as Team[] | null) ?? [];
}

export async function getTeamDashboard(
  teamId: string
): Promise<TeamDashboardData | null> {
  const supabase = await createClient();

  const { data: teamData } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  const team = teamData as Team | null;
  if (!team) return null;

  const { data: employeesData } = await supabase
    .from("employees")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("full_name");

  const employees = (employeesData as Employee[] | null) ?? [];

  if (!employees.length) {
    return {
      team,
      employees: [],
      presenceSummary: emptyPresenceSummary(),
      totalPresent: 0,
    };
  }

  const employeeIds = employees.map((e) => e.id);

  const [presenceResult, tasksResult] = await Promise.all([
    supabase
      .from("employee_presence")
      .select("*")
      .in("employee_id", employeeIds),
    supabase
      .from("tasks")
      .select("*")
      .in("assigned_to", employeeIds)
      .eq("status", "in_progress"),
  ]);

  const presenceMap = new Map<string, EmployeePresence>(
    ((presenceResult.data as EmployeePresence[] | null) ?? []).map((p) => [
      p.employee_id,
      p,
    ])
  );

  const taskMap = new Map<string, Task>();
  ((tasksResult.data as Task[] | null) ?? []).forEach((t) => {
    if (t.assigned_to && !taskMap.has(t.assigned_to)) {
      taskMap.set(t.assigned_to, t);
    }
  });

  const enriched: EmployeeWithPresence[] = employees.map((emp) => ({
    ...emp,
    presence: presenceMap.get(emp.id) ?? null,
    current_task: taskMap.get(emp.id) ?? null,
  }));

  const summary = emptyPresenceSummary();
  enriched.forEach((emp) => {
    const s = emp.presence?.availability_status ?? "available";
    summary[s]++;
  });

  return {
    team,
    employees: enriched,
    presenceSummary: summary,
    totalPresent: enriched.length,
  };
}

export async function getEmployeeTimeline(employeeId: string) {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("actor_id", employeeId)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

function emptyPresenceSummary(): Record<AvailabilityStatus, number> {
  return {
    available: 0,
    busy: 0,
    in_meeting: 0,
    field_work: 0,
    remote: 0,
    offline: 0,
  };
}
