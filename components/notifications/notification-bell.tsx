"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Json, Notification } from "@/types/database";

function getTaskId(data: Json | null): string | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
  const v = (data as Record<string, Json>).task_id;
  return typeof v === "string" ? v : undefined;
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  return `${Math.floor(hrs / 24)}ي`;
}

interface Props {
  employeeId: string | null;
}

export function NotificationBell({ employeeId }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!employeeId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as Notification[] | null) ?? []);
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel(`notif-bell:${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${employeeId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${employeeId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === (payload.new as Notification).id
                ? (payload.new as Notification)
                : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, fetchNotifications]);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function markAllRead(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  const preview = notifications.slice(0, 5);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="الإشعارات"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -end-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] leading-none pointer-events-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 text-sm font-semibold flex items-center gap-2">
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-medium">
                {unreadCount} جديد
              </Badge>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              قراءة الكل
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[360px] overflow-y-auto">
          {preview.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
              لا توجد إشعارات
            </div>
          ) : (
            preview.map((n) => {
              const taskId = getTaskId(n.data);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markRead(n.id);
                    if (taskId) router.push(`/dashboard/assignments/${taskId}`);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex flex-col items-start gap-1 px-4 py-3 text-start border-b last:border-0 hover:bg-accent transition-colors",
                    !n.is_read && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />
                      )}
                      <p
                        className={cn(
                          "text-sm font-medium leading-tight",
                          n.is_read && "ms-4 text-muted-foreground"
                        )}
                      >
                        {n.title}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 ms-4">
                      {n.body}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DropdownMenuSeparator className="my-0" />
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 text-xs text-primary py-2.5 font-medium hover:bg-accent transition-colors"
          onClick={() => {
            router.push("/dashboard/notifications");
            setOpen(false);
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          عرض جميع الإشعارات
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
