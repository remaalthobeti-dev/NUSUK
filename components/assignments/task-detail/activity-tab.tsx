import { Activity } from "lucide-react";
import type { TaskActivityEntry } from "@/lib/data/task-detail";
import { timeAgo } from "@/components/assignments/card-utils";

interface Props {
  entries: TaskActivityEntry[];
}

const EVENT_ICONS: Record<string, string> = {
  // Task lifecycle
  task_created:        "✨",
  task_claimed:        "📥",
  task_assigned:       "📌",
  task_approved:       "✅",
  task_returned:       "↩️",

  // Review
  review_started:      "🔍",
  review_requested:    "👁️",
  review_accepted:     "✅",
  review_rejected:     "❌",

  // Collaboration
  collaboration_requested: "🤝",
  collaboration_accepted:  "✅",
  collaboration_rejected:  "❌",

  // Status changes
  status_in_progress:  "▶️",
  status_on_hold:      "⏸️",
  status_pending:      "⏳",
  status_completed:    "🎉",
  status_cancelled:    "🚫",

  // Other
  comment_added:       "💬",
  attachment_added:    "📎",
  participant_added:   "➕",
  participant_removed: "➖",
};

function roleLabel(eventType: string): string {
  if (eventType.startsWith("review")) return "مراجع";
  if (eventType.startsWith("collaboration")) return "مشارك";
  if (eventType === "task_claimed") return "مستلم";
  if (eventType === "task_created" || eventType === "task_assigned") return "منشئ";
  return "";
}

export function ActivityTab({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "hsl(var(--n-gold) / .08)", border: "1.5px solid hsl(var(--n-gold) / .18)" }}>
          <Activity className="h-6 w-6" style={{ color: "hsl(var(--n-gold) / .5)" }} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">لا يوجد نشاط مسجل بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-4">
        {entries.length} حدث مسجل · من الأقدم إلى الأحدث
      </p>
      <ol className="relative border-s border-muted ms-4 space-y-5">
        {entries.map((entry) => {
          const icon = EVENT_ICONS[entry.event_type] ?? "•";
          const role = roleLabel(entry.event_type);
          return (
            <li key={entry.id} className="ms-6">
              <span className="absolute flex items-center justify-center w-8 h-8 -start-4 rounded-full bg-muted text-base">
                {icon}
              </span>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm">{entry.description}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                  {entry.employee?.full_name && (
                    <>
                      <span className="font-medium">{entry.employee.full_name}</span>
                      {role && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                          {role}
                        </span>
                      )}
                      <span>·</span>
                    </>
                  )}
                  {timeAgo(entry.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
