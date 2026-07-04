import type { HeroMetrics } from "@/lib/data/analytics-executive";

interface Props {
  metrics: HeroMetrics;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: "blue" | "emerald" | "amber" | "red";
}

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  const accentClass = {
    blue:    "text-blue-600    dark:text-blue-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber:   "text-amber-600   dark:text-amber-400",
    red:     "text-red-600     dark:text-red-400",
  }[accent];

  const bgClass = {
    blue:    "bg-blue-50/60    dark:bg-blue-950/20   border-blue-200/50    dark:border-blue-800/30",
    emerald: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30",
    amber:   "bg-amber-50/60   dark:bg-amber-950/20   border-amber-200/50   dark:border-amber-800/30",
    red:     "bg-red-50/60     dark:bg-red-950/20     border-red-200/50     dark:border-red-800/30",
  }[accent];

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-1 ${bgClass}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function HeroMetricsSection({ metrics }: Props) {
  const cards: KpiCardProps[] = [
    {
      label: "إجمالي المهام",
      value: metrics.totalTasks,
      sub: "جميع المهام في النظام",
      accent: "blue",
    },
    {
      label: "معدل الإنجاز",
      value: `${metrics.completionRate}%`,
      sub: "من المهام المسندة",
      accent: "emerald",
    },
    {
      label: "المهام النشطة",
      value: metrics.activeTasks,
      sub: "جارية أو جديدة",
      accent: "amber",
    },
    {
      label: "المهام المتأخرة",
      value: metrics.overdueTasks,
      sub: metrics.overdueTasks === 0 ? "لا توجد تأخيرات" : "تجاوزت تاريخ التسليم",
      accent: "red",
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
