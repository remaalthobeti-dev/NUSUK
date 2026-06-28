"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Circle,
  CircleCheck,
  Filter,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/database";

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; colorClass: string; bg: string }
> = {
  task_assigned: {
    label: "تكليف مهمة",
    colorClass: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/50",
  },
  task_updated: {
    label: "تحديث مهمة",
    colorClass: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/50",
  },
  task_completed: {
    label: "إنجاز مهمة",
    colorClass: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-950/50",
  },
  comment_added: {
    label: "تعليق جديد",
    colorClass: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/50",
  },
  mention: {
    label: "إشارة",
    colorClass: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-950/50",
  },
  system: {
    label: "نظام",
    colorClass: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/50",
  },
};

const FILTER_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "unread", label: "غير مقروءة" },
  { value: "read", label: "مقروءة" },
];

interface NotificationCenterProps {
  initialNotifications: Notification[];
}

export function NotificationCenter({
  initialNotifications,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  async function markRead(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );
  }

  async function markAllRead() {
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
  }

  async function handleExcelExport() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      notifications.map((n) => ({
        العنوان: n.title,
        النوع: TYPE_CONFIG[n.type]?.label ?? n.type,
        المحتوى: n.body ?? "",
        الحالة: n.is_read ? "مقروء" : "غير مقروء",
        التاريخ: new Date(n.created_at).toLocaleString("ar-SA"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الإشعارات");
    XLSX.writeFile(wb, `إشعارات-نسك-${new Date().toLocaleDateString("ar-SA")}.xlsx`);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value as typeof filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
              {opt.value === "unread" && unreadCount > 0 && (
                <span className="ms-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-foreground text-primary text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExcelExport}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            قراءة الكل
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="لا توجد إشعارات"
          description={filter === "unread" ? "جميع الإشعارات مقروءة" : "لا توجد إشعارات بعد"}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => markRead(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const typeCfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border p-4 transition-all",
        !notification.is_read
          ? "bg-primary/5 dark:bg-primary/10 border-primary/20"
          : "bg-muted/20 border-transparent"
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          typeCfg.bg
        )}
      >
        <Bell className={cn("h-4 w-4", typeCfg.colorClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("font-semibold text-sm", !notification.is_read && "text-foreground")}>
              {notification.title}
            </p>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-2 border-0", typeCfg.bg, typeCfg.colorClass)}
            >
              {typeCfg.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground font-mono">{timeAgo}</span>
            {!notification.is_read && (
              <button
                type="button"
                onClick={onMarkRead}
                title="تعليم كمقروء"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <CircleCheck className="h-4 w-4" />
              </button>
            )}
            {notification.is_read && (
              <Circle className="h-3 w-3 text-muted-foreground/30" />
            )}
          </div>
        </div>
        {notification.body && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {notification.body}
          </p>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins} دقيقة`;
  if (hrs < 24) return `${hrs} ساعة`;
  return `${days} يوم`;
}
