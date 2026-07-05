import {
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { HeroMetrics } from "@/lib/data/analytics-executive";

interface Props {
  metrics: HeroMetrics;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor: string;
  trend?: { value: number; positive: boolean };
}

function KpiCard({ label, value, sub, icon, iconBg, valueColor, trend }: KpiCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Icon + trend row */}
      <div className="flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              trend.positive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className={`text-4xl font-bold tabular-nums leading-none ${valueColor}`}>
          {value}
        </p>
        <p className="text-sm font-semibold text-foreground mt-2 leading-snug">{label}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
        )}
      </div>
    </div>
  );
}

export function HeroMetricsSection({ metrics }: Props) {
  const cards: KpiCardProps[] = [
    {
      label: "إجمالي المهام",
      value: metrics.totalTasks,
      sub: "جميع المهام في النظام",
      icon: <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-100 dark:bg-blue-950/40",
      valueColor: "text-blue-700 dark:text-blue-400",
    },
    {
      label: "معدل الإنجاز",
      value: `${metrics.completionRate}%`,
      sub: "من المهام المسندة",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
      valueColor: "text-emerald-700 dark:text-emerald-400",
      trend: { value: 8, positive: true },
    },
    {
      label: "المهام النشطة",
      value: metrics.activeTasks,
      sub: "جارية أو جديدة",
      icon: <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-100 dark:bg-amber-950/40",
      valueColor: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "المهام المتأخرة",
      value: metrics.overdueTasks,
      sub: metrics.overdueTasks === 0 ? "لا توجد تأخيرات ✓" : "تجاوزت تاريخ التسليم",
      icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />,
      iconBg: "bg-red-100 dark:bg-red-950/40",
      valueColor: metrics.overdueTasks === 0
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-red-700 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
