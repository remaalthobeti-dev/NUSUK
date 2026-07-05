import type { LiveInsight, InsightSeverity } from "@/lib/data/analytics-executive";

interface Props {
  insights: LiveInsight[];
}

const SEVERITY_CARD: Record<InsightSeverity, string> = {
  danger:  "border-red-200/70    dark:border-red-800/30   bg-red-50/80     dark:bg-red-950/20     text-red-800     dark:text-red-300",
  warning: "border-amber-200/70  dark:border-amber-800/30 bg-amber-50/80   dark:bg-amber-950/20   text-amber-800   dark:text-amber-300",
  info:    "border-blue-200/70   dark:border-blue-800/30  bg-blue-50/80    dark:bg-blue-950/20    text-blue-800    dark:text-blue-300",
  success: "border-emerald-200/70 dark:border-emerald-800/30 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300",
};

const SEVERITY_METRIC: Record<InsightSeverity, string> = {
  danger:  "bg-red-100/80    dark:bg-red-900/30    text-red-700     dark:text-red-300",
  warning: "bg-amber-100/80  dark:bg-amber-900/30  text-amber-700   dark:text-amber-300",
  info:    "bg-blue-100/80   dark:bg-blue-900/30   text-blue-700    dark:text-blue-300",
  success: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
};

const SEVERITY_ICON_BG: Record<InsightSeverity, string> = {
  danger:  "bg-red-100    dark:bg-red-900/30",
  warning: "bg-amber-100  dark:bg-amber-900/30",
  info:    "bg-blue-100   dark:bg-blue-900/30",
  success: "bg-emerald-100 dark:bg-emerald-900/30",
};

export function LiveInsightsSection({ insights }: Props) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">التنبيهات الفورية</h2>
            <p className="text-xs text-muted-foreground">تحديث تلقائي عند تغيير البيانات</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-full">
          مباشر
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 transition-shadow duration-200 hover:shadow-sm ${SEVERITY_CARD[insight.severity]}`}
          >
            {/* Icon in colored bg circle */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${SEVERITY_ICON_BG[insight.severity]}`}
            >
              <span className="text-base">{insight.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{insight.title}</p>
              <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{insight.description}</p>
              {insight.metric && (
                <span
                  className={`inline-block mt-2 text-[10px] font-bold rounded-full px-2.5 py-0.5 ${SEVERITY_METRIC[insight.severity]}`}
                >
                  {insight.metric}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
