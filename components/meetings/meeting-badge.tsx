import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MeetingType, MeetingDisplayStatus, MeetingPriority } from "@/types/database";

export const MEETING_TYPE_CONFIG: Record<
  MeetingType,
  { label: string; className: string }
> = {
  team: {
    label: "فريق",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  cross_team: {
    label: "متعدد الفرق",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  organization: {
    label: "تنظيمي",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

export const DISPLAY_STATUS_CONFIG: Record<
  MeetingDisplayStatus,
  { label: string; className: string; dot: string }
> = {
  scheduled: {
    label: "مجدول",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "جارٍ الآن",
    className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    dot: "bg-green-500 animate-pulse",
  },
  completed: {
    label: "مكتمل",
    className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "ملغى",
    className: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export const PRIORITY_CONFIG: Record<
  MeetingPriority,
  { label: string; className: string; icon: string }
> = {
  urgent: {
    label: "عاجل",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: "🔴",
  },
  high: {
    label: "عالية",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: "🟠",
  },
  normal: {
    label: "عادية",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    icon: "🔵",
  },
};

export function MeetingTypeBadge({ type }: { type: MeetingType }) {
  const cfg = MEETING_TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border-0", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export function MeetingStatusBadge({ displayStatus }: { displayStatus: MeetingDisplayStatus }) {
  const cfg = DISPLAY_STATUS_CONFIG[displayStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
        cfg.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function MeetingPriorityBadge({ priority }: { priority: MeetingPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  if (priority === "normal") return null; // don't show badge for normal priority
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
        cfg.className
      )}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
