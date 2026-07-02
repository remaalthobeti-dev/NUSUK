import { Calendar, Clock, Building2, User, FileText, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, formatDuration, formatDueDate, progressBarColor } from "@/components/assignments/card-utils";
import type { TaskDetailTask } from "@/lib/data/task-detail";

interface Props {
  task: TaskDetailTask;
}

type AttachmentEntry = { name: string; url: string; size: number; type: string };

function parseAttachments(metadata: unknown): AttachmentEntry[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const raw = (metadata as Record<string, unknown>).attachments;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is AttachmentEntry =>
      typeof a === "object" && a !== null &&
      typeof (a as AttachmentEntry).name === "string" &&
      typeof (a as AttachmentEntry).url === "string"
  );
}

export function OverviewTab({ task }: Props) {
  const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const due = formatDueDate(task.due_date);
  const attachments = parseAttachments(task.metadata);

  return (
    <div className="space-y-6">
      {/* ── Description ── */}
      {task.description ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            الوصف
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/40 px-4 py-3">
            {task.description}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">لا يوجد وصف للمهمة.</p>
      )}

      {/* ── Progress ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">التقدم</span>
          <span className="text-muted-foreground">{statusConf.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", progressBarColor(statusConf.progress))}
            style={{ width: `${statusConf.progress}%` }}
          />
        </div>
      </div>

      {/* ── Details grid ── */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <DetailItem
          icon={Calendar}
          label="تاريخ الاستحقاق"
          value={due?.text ?? "غير محدد"}
          urgent={due?.urgent}
        />
        <DetailItem
          icon={Clock}
          label="الوقت المقدر"
          value={
            task.estimated_minutes != null
              ? formatDuration(task.estimated_minutes)
              : "غير محدد"
          }
        />
        <DetailItem
          icon={Building2}
          label="الفريق"
          value={task.team?.name ?? "—"}
        />
        <DetailItem
          icon={User}
          label="المُسند إليه"
          value={task.assignee?.full_name ?? "غير مسندة"}
        />
        <DetailItem
          icon={User}
          label="أنشأ بواسطة"
          value={task.creator?.full_name ?? "—"}
        />
        {task.started_at && (
          <DetailItem
            icon={Clock}
            label="تاريخ البدء"
            value={new Date(task.started_at).toLocaleDateString("ar-SA")}
          />
        )}
      </div>
      {/* ── Attachments ── */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            المرفقات ({attachments.length})
          </h2>
          <div className="space-y-1.5">
            {attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm hover:bg-muted/60 transition-colors group"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate group-hover:text-primary transition-colors">
                  {att.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {Math.round(att.size / 1024)} KB
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  urgent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={cn("font-medium", urgent && "text-red-600 dark:text-red-400")}>{value}</p>
    </div>
  );
}
