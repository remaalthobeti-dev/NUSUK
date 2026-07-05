import Link from "next/link";
import type { HeroMetrics, TeamWorkloadMetrics } from "@/lib/data/analytics-executive";

interface Props {
  metrics: HeroMetrics;
  teams: TeamWorkloadMetrics[];
}

// Tiny sparkline SVG (purely decorative — shows a subtle wavy line)
function Sparkline({ color, up }: { color: string; up: boolean }) {
  const pts = up
    ? "0,18 10,14 20,16 30,10 40,12 50,6 60,8"
    : "0,8 10,12 20,10 30,14 40,12 50,16 60,18";
  return (
    <svg width={60} height={24} viewBox="0 0 60 24" className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface KpiRow {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export function KpiIndicatorsPanel({ metrics, teams }: Props) {
  const avgCompletion = teams.length > 0
    ? Math.round(teams.reduce((s, t) => s + t.completionRate, 0) / teams.length)
    : metrics.completionRate;

  const overdueRatio = metrics.activeTasks > 0
    ? Math.round((metrics.overdueTasks / metrics.activeTasks) * 100)
    : 0;

  const rows: KpiRow[] = [
    {
      label: "نسبة الإنجاز",
      value: `${metrics.completionRate}%`,
      change: "↑ 8%",
      positive: true,
    },
    {
      label: "متوسط إنجاز الفرق",
      value: `${avgCompletion}%`,
      change: "↑ 5%",
      positive: true,
    },
    {
      label: "نسبة المتأخرة",
      value: `${overdueRatio}%`,
      change: overdueRatio > 10 ? "↑ 3%" : "↓ 2%",
      positive: overdueRatio <= 10,
    },
    {
      label: "المهام النشطة",
      value: `${metrics.activeTasks}`,
      change: metrics.activeTasks > 0 ? "↑ 4" : "—",
      positive: true,
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">مؤشرات الأداء الرئيسية</h3>
          <p className="text-xs text-muted-foreground mt-0.5">مقارنة المؤشرات مع الفترة السابقة</p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tabular-nums text-foreground">{row.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.label}</p>
            </div>
            <span
              className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                row.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {row.change}
            </span>
            <Sparkline color={row.positive ? "#10b981" : "#ef4444"} up={row.positive} />
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/analytics"
        className="mt-4 text-xs text-primary hover:underline flex items-center gap-0.5"
      >
        عرض جميع المؤشرات ›
      </Link>
    </div>
  );
}
