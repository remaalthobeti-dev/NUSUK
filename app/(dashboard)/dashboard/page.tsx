import type { Metadata } from "next";
import { getAllTeams } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { TeamCard } from "@/components/dashboard/team-card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import type { AvailabilityStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "الرئيسية",
};

export default async function DashboardPage() {
  const [teams, supabase] = await Promise.all([
    getAllTeams(),
    createClient(),
  ]);

  // Fetch presence counts per team for the cards
  const { data: presenceRows } = await supabase
    .from("employee_presence")
    .select("employee_id, availability_status, employees!inner(team_id)")
    .returns<{
      employee_id: string;
      availability_status: AvailabilityStatus;
      employees: { team_id: string };
    }[]>();

  // Fetch employee counts per team
  const { data: empRows } = await supabase
    .from("employees")
    .select("team_id")
    .eq("is_active", true)
    .returns<{ team_id: string }[]>();

  // Build maps
  const empCountMap: Record<string, number> = {};
  (empRows ?? []).forEach((e) => {
    if (e.team_id) empCountMap[e.team_id] = (empCountMap[e.team_id] ?? 0) + 1;
  });

  const presenceMap: Record<
    string,
    Partial<Record<AvailabilityStatus, number>>
  > = {};
  (presenceRows ?? []).forEach((p) => {
    const teamId = p.employees?.team_id;
    if (!teamId) return;
    if (!presenceMap[teamId]) presenceMap[teamId] = {};
    const cur = presenceMap[teamId][p.availability_status] ?? 0;
    presenceMap[teamId][p.availability_status] = cur + 1;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            اختر فريقاً لعرض التفاصيل والموظفين
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 hidden sm:flex">
          <Activity className="h-3 w-3 text-green-500" />
          النظام يعمل
        </Badge>
      </div>

      {/* Section title */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          الفرق التشغيلية
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              employeeCount={empCountMap[team.id] ?? 0}
              presenceCounts={presenceMap[team.id] ?? {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
