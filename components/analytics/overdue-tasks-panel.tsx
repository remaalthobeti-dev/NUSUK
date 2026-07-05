import Link from "next/link";
import type { OverdueTaskDetail } from "@/lib/data/analytics-executive";

interface Props {
  tasks: OverdueTaskDetail[];
}

function DaysLateBadge({ days }: { days: number }) {
  const cls =
    days <= 2
      ? "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30"
      : days <= 5
        ? "text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/30"
        : "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30";

  return (
    <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${cls}`}>
      {days} أيام
    </span>
  );
}

export function OverdueTasksPanel({ tasks }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">المهام المتأخرة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">آخر {tasks.length} مهام متأخرة</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-2xl">✅</span>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">لا توجد مهام متأخرة</p>
          <p className="text-xs text-muted-foreground">جميع المهام في موعدها</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-1 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">المهمة</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">الفريق</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">الاستحقاق</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">التأخر</span>
          </div>

          <div className="space-y-1.5 flex-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-1 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-medium text-foreground truncate">{task.title}</span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{task.teamName}</span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                  {new Date(task.dueDate).toLocaleDateString("ar-SA", {
                    month: "numeric",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </span>
                <DaysLateBadge days={task.daysLate} />
              </div>
            ))}
          </div>
        </>
      )}

      <Link
        href="/dashboard/assignments"
        className="mt-4 text-xs text-primary hover:underline flex items-center gap-0.5"
      >
        عرض جميع المهام المتأخرة ›
      </Link>
    </div>
  );
}
