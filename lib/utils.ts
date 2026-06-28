import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: "ar" | "en" = "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(
  date: string | Date,
  locale: "ar" | "en" = "ar"
) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "مدير النظام",
    supervisor: "مشرف",
    employee: "موظف",
  };
  return labels[role] ?? role;
}
