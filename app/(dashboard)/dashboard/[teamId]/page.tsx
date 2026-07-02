import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeamDashboard } from "@/lib/data/dashboard";
import { requireAuthenticated } from "@/lib/auth/guards";
import { TeamDashboard } from "@/components/dashboard/team-dashboard";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teamId } = await params;
  try {
    const data = await getTeamDashboard(teamId);
    return { title: data?.team.name ? `${data.team.name} — نسك` : "الفريق" };
  } catch {
    return { title: "الفريق" };
  }
}

export default async function TeamPage({ params }: PageProps) {
  const { teamId } = await params;

  const { context, error } = await requireAuthenticated();
  if (error) notFound();

  const isSuperAdmin = context.employee.role === "super_admin";

  let data;
  try { data = await getTeamDashboard(teamId); } catch { notFound(); return; }
  if (!data) notFound();

  return (
    <div
      className="min-h-screen"
      style={{ "--team-color": data.team.color } as React.CSSProperties}
    >
      <TeamDashboard
        team={data.team}
        employees={data.employees}
        presenceSummary={data.presenceSummary}
        totalPresent={data.totalPresent}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
