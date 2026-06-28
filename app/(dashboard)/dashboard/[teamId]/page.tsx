import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeamDashboard, getEmployeeTimeline } from "@/lib/data/dashboard";
import { TeamDashboard } from "@/components/dashboard/team-dashboard";
import type { ActivityLog } from "@/types/database";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teamId } = await params;
  const data = await getTeamDashboard(teamId);
  return { title: data?.team.name ?? "الفريق" };
}

export default async function TeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const data = await getTeamDashboard(teamId);

  if (!data) notFound();

  // Fetch today's timeline for every employee in the team (in parallel)
  const timelineEntries = await Promise.all(
    data.employees.map((emp) =>
      getEmployeeTimeline(emp.id).then((logs) => [emp.id, logs] as const)
    )
  );

  const timelineMap: Record<string, ActivityLog[]> = Object.fromEntries(
    timelineEntries
  );

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--team-color": data.team.color,
        } as React.CSSProperties
      }
    >
      <TeamDashboard
        team={data.team}
        employees={data.employees}
        presenceSummary={data.presenceSummary}
        totalPresent={data.totalPresent}
        timelineMap={timelineMap}
      />
    </div>
  );
}
