import type { TaskPriority, TaskStatus } from "@/types/database";

// ─── Sort helper (used client-side only) ─────────────────────────────────────

export function priorityOrder(p: TaskPriority): number {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}

// ─── Priority ─────────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  urgent: {
    label: "عاجل",
    className:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
  high: {
    label: "عالية",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  },
  medium: {
    label: "متوسطة",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  low: {
    label: "منخفضة",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string; progress: number }
> = {
  available: {
    label: "متاحة",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    progress: 0,
  },
  pending: {
    label: "قيد الانتظار",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    progress: 10,
  },
  in_progress: {
    label: "جارية",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    progress: 50,
  },
  on_hold: {
    label: "بانتظار المراجعة",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
    progress: 80,
  },
  completed: {
    label: "مكتملة",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    progress: 100,
  },
  cancelled: {
    label: "ملغاة",
    className:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    progress: 0,
  },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} د`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}س ${m}د` : `${h} ساعة`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  if (d === 1) return "أمس";
  if (d < 30) return `منذ ${d} أيام`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

export function formatDueDate(
  iso: string | null
): { text: string; urgent: boolean } | null {
  if (!iso) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(iso);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.round(
    (dueDay.getTime() - today.getTime()) / 86400000
  );

  if (diff < 0)
    return { text: `متأخر ${Math.abs(diff)} يوم`, urgent: true };
  if (diff === 0) return { text: "اليوم", urgent: true };
  if (diff === 1) return { text: "غداً", urgent: false };
  if (diff <= 7) return { text: `خلال ${diff} أيام`, urgent: false };
  return { text: dueDay.toLocaleDateString("ar-SA"), urgent: false };
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function progressBarColor(pct: number): string {
  if (pct === 100) return "bg-emerald-500";
  if (pct === 0) return "bg-slate-300 dark:bg-slate-600";
  return "bg-blue-500";
}
