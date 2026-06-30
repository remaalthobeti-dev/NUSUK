import { Activity } from "lucide-react";
import type { TaskActivityEntry } from "@/lib/data/task-detail";
import { timeAgo } from "@/components/assignments/card-utils";

interface Props {
  entries: TaskActivityEntry[];
}

const EVENT_ICONS: Record<string, string> = {
  task_claimed: "📥",
  task_created: "✨",
  collaboration_requested: "🤝",
  collaboration_accepted: "✅",
  collaboration_rejected: "❌",
  review_requested: "👁️",
  review_accepted: "✅",
  review_rejected: "❌",
  comment_added: "💬",
  status_changed: "🔄",
  task_completed: "🎉",
};

export function ActivityTab({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
          <Activity className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">لا يوجد نشاط مسجل بعد.</p>
      </div>
    );
  }

  return (
    <ol className="relative border-s border-muted ms-4 space-y-6">
      {entries.map((entry) => {
        const icon = EVENT_ICONS[entry.event_type] ?? "•";
        return (
          <li key={entry.id} className="ms-6">
            <span className="absolute flex items-center justify-center w-8 h-8 -start-4 rounded-full bg-muted text-base">
              {icon}
            </span>
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-sm">{entry.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {entry.employee?.full_name && (
                  <span className="font-medium">{entry.employee.full_name} · </span>
                )}
                {timeAgo(entry.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
