import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date, locale: "ar" | "en" = "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale: "ar" | "en" = "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Returns how long ago a status started, e.g. "منذ ساعتين". */
export function formatStatusDuration(startedAt: string | null | undefined): string {
  if (!startedAt) return "";
  const diff = Date.now() - new Date(startedAt).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h === 1) return "منذ ساعة";
  if (h === 2) return "منذ ساعتين";
  if (h < 24) return `منذ ${h} ساعات`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

// ─── Role Labels ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:   "مدير النظام",
  track_manager: "مشرف المسار",
  team_member:   "عضو الفريق",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role;
}


