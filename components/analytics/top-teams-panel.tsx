import Link from "next/link";
import type { TeamWorkloadMetrics } from "@/lib/data/analytics-executive";

interface Props {
  teams: TeamWorkloadMetrics[];
}

const TROPHY: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export function TopTeamsPanel({ teams }: Props) {
  const ranked = [...teams]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 4);

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">أعلى الفرق أداءً</h3>
          <p className="text-xs text-muted-foreground mt-0.5">ترتيب الفرق حسب نسبة الإنجاز</p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          لا توجد بيانات
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {ranked.map((team, i) => (
            <div key={team.teamId} className="flex items-center gap-3">
              <span className="text-xl w-7 text-center shrink-0 leading-none">
                {TROPHY[i] ?? <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground truncate">{team.teamName}</span>
                  <span className="text-xs font-bold tabular-nums text-foreground ms-2 shrink-0">
                    {team.completionRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${team.completionRate}%`,
                      background:
                        i === 0 ? "linear-gradient(90deg,#f59e0b,#c9963e)"
                        : i === 1 ? "linear-gradient(90deg,#94a3b8,#cbd5e1)"
                        : i === 2 ? "linear-gradient(90deg,#c2864d,#e4a96a)"
                        : "hsl(var(--primary))",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/operations"
        className="mt-4 text-xs text-primary hover:underline flex items-center gap-0.5"
      >
        عرض جميع الفرق ›
      </Link>
    </div>
  );
}
