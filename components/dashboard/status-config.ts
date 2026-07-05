import type { AvailabilityStatus, TaskPriority } from "@/types/database";

export interface StatusConfig {
  label: string;
  emoji: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  badgeClass: string;
  ringClass: string;
}

export const STATUS_CONFIG: Record<AvailabilityStatus, StatusConfig> = {
  available: {
    label: "متاح",
    emoji: "🟢",
    color: "#22c55e",
    bgClass: "bg-green-500",
    textClass: "text-green-700 dark:text-green-400",
    borderClass: "border-green-500",
    dotClass: "bg-green-500",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800",
    ringClass: "ring-green-500/30",
  },
  busy: {
    label: "مشغول",
    emoji: "🟡",
    color: "#f59e0b",
    bgClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-500",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    ringClass: "ring-amber-500/30",
  },
  in_meeting: {
    label: "في اجتماع",
    emoji: "🔵",
    color: "#3b82f6",
    bgClass: "bg-blue-500",
    textClass: "text-blue-700 dark:text-blue-400",
    borderClass: "border-blue-500",
    dotClass: "bg-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    ringClass: "ring-blue-500/30",
  },
  field_work: {
    label: "في جولة ميدانية",
    emoji: "🟣",
    color: "#a855f7",
    bgClass: "bg-purple-500",
    textClass: "text-purple-700 dark:text-purple-400",
    borderClass: "border-purple-500",
    dotClass: "bg-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    ringClass: "ring-purple-500/30",
  },
  remote: {
    label: "خارج المكتب",
    emoji: "🟠",
    color: "#f97316",
    bgClass: "bg-orange-500",
    textClass: "text-orange-700 dark:text-orange-400",
    borderClass: "border-orange-500",
    dotClass: "bg-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    ringClass: "ring-orange-500/30",
  },
  offline: {
    label: "خارج الدوام",
    emoji: "⚪",
    color: "#94a3b8",
    bgClass: "bg-slate-400",
    textClass: "text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-400",
    dotClass: "bg-slate-400",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    ringClass: "ring-slate-400/30",
  },
};

export const STATUS_OPTIONS: AvailabilityStatus[] = [
  "available",
  "busy",
  "in_meeting",
  "field_work",
  "remote",
  "offline",
];

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; badgeClass: string }
> = {
  low: {
    label: "منخفضة",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  medium: {
    label: "متوسطة",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
  high: {
    label: "عالية",
    badgeClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  },
  urgent: {
    label: "عاجلة",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  },
};

export const TEAM_EMOJI: Record<string, string> = {
  handshake: "🤝",
  truck: "📦",
  cpu: "💻",
  settings: "⚙️",
  users: "👥",
  shield: "🛡️",
  star: "⭐",
  chart: "📊",
  target: "🎯",
  globe: "🌐",
};

export function formatRemaining(dueDate: string | null): string {
  if (!dueDate) return "—";
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff <= 0) return "منتهية";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}س ${m}د`;
  return `${m} دقيقة`;
}

export function calcProgress(
  startedAt: string | null,
  dueDate: string | null
): number {
  if (!startedAt || !dueDate) return 0;
  const start = new Date(startedAt).getTime();
  const end = new Date(dueDate).getTime();
  const now = Date.now();
  if (end <= start) return 0;
  return Math.min(
    100,
    Math.max(0, Math.round(((now - start) / (end - start)) * 100))
  );
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}
