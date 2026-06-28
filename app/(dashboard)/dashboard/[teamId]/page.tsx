import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeamDashboard } from "@/lib/data/dashboard";
import { TeamDashboard } from "@/components/dashboard/team-dashboard";

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
      />
    </div>
  );
}
