import type { LiveInsight, InsightSeverity } from "@/lib/data/analytics-executive";

interface Props {
  insights: LiveInsight[];
}

function severityStyle(s: InsightSeverity) {
  return {
    danger:  "border-red-200    dark:border-red-800/40   bg-red-50/60     dark:bg-red-950/20     text-red-800     dark:text-red-300",
    warning: "border-amber-200  dark:border-amber-800/40  bg-amber-50/60   dark:bg-amber-950/20   text-amber-800   dark:text-amber-300",
    info:    "border-blue-200   dark:border-blue-800/40   bg-blue-50/60    dark:bg-blue-950/20    text-blue-800    dark:text-blue-300",
    success: "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300",
  }[s];
}

function metricStyle(s: InsightSeverity) {
  return {
    danger:  "bg-red-100    dark:bg-red-900/30    text-red-700     dark:text-red-300",
    warning: "bg-amber-100  dark:bg-amber-900/30  text-amber-700   dark:text-amber-300",
    info:    "bg-blue-100   dark:bg-blue-900/30   text-blue-700    dark:text-blue-300",
    success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  }[s];
}

export function LiveInsightsSection({ insights }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Live Insights
        </h2>
        <span className="text-xs text-muted-foreground font-normal">— تحديث مباشر</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${severityStyle(insight.severity)}`}
          >
            <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{insight.title}</p>
              <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{insight.description}</p>
              {insight.metric && (
                <span className={`inline-block mt-1.5 text-[10px] font-bold rounded-full px-2 py-0.5 ${metricStyle(insight.severity)}`}>
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
