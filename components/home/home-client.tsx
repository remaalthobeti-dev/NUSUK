"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  LayoutDashboard,
  FileCheck,
  ListTodo,
  AlertCircle,
  Link2,
  Activity,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MeetingTypeBadge,
  MeetingStatusBadge,
  MeetingPriorityBadge,
} from "@/components/meetings/meeting-badge";
import { MeetingShortTime } from "@/components/meetings/meeting-time";
import { CreateTaskDialog } from "@/components/assignments/create-task-dialog";
import { CreateCircularDialog } from "@/components/home/create-circular-dialog";
import { MyStatusDialog } from "@/components/shared/my-status-dialog";
import { STATUS_CONFIG } from "@/components/dashboard/status-config";
import { useMyPresence } from "@/hooks/use-my-presence";
import type { AvailabilityStatus, UserRole, MeetingWithDetails, Team } from "@/types/database";

export interface LatestAnnouncement {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  is_read: boolean;
}

// ─── Hijri date helper ────────────────────────────────────────────────────────

function useTodayDates() {
  const [dates, setDates] = useState<{ hijri: string; gregorian: string } | null>(null);

  useEffect(() => {
    const now = new Date();

    const hijri = now.toLocaleDateString("ar-SA-u-ca-islamic", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const gregorian = now.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    setDates({ hijri, gregorian });
  }, []);

  return dates;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeClientProps {
  employeeName: string;
  role: UserRole;
  employeeTeamId: string | null;
  teams: Team[];
  currentStatus: AvailabilityStatus;
  taskCounts: {
    assigned: number;
    pending: number;
    completedToday: number;
  };
  unreadNotifications: number;
  todaysMeetings: MeetingWithDetails[];
  latestAnnouncement: LatestAnnouncement | null;
  unreadAnnouncements: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeClient({
  employeeName,
  role,
  employeeTeamId,
  teams,
  currentStatus,
  taskCounts,
  unreadNotifications,
  todaysMeetings,
  latestAnnouncement,
  unreadAnnouncements,
}: HomeClientProps) {
  const [greeting, setGreeting] = useState<string>("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const todayDates = useTodayDates();
  const { presence, refetch } = useMyPresence();

  const liveStatus = presence?.availability_status ?? currentStatus;
  const liveNote = presence?.notes ?? null;
  const statusCfg = STATUS_CONFIG[liveStatus];

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "صباح الخير" : "مساء الخير");
  }, []);

  const canManage = role === "super_admin" || role === "track_manager";

  const alerts: string[] = [];
  if (taskCounts.pending > 0)
    alerts.push(`لديك ${taskCounts.pending} مهام قيد الانتظار`);
  if (unreadNotifications > 0)
    alerts.push(`لديك ${unreadNotifications} إشعارات غير مقروءة`);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Row 1: Greeting + Status ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Greeting card */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {greeting || "مرحباً"}
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              {employeeName}
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1.5">
              مرحبًا بعودتك، نتمنى لك يومًا مليئًا بالإنجاز.
            </p>

            {/* Dates */}
            {todayDates && (
              <div className="mt-4 space-y-0.5">
                <p className="text-xs text-muted-foreground">{todayDates.hijri} هـ</p>
                <p className="text-xs text-muted-foreground/70">
                  الموافق {todayDates.gregorian}
                </p>
              </div>
            )}

            {/* Live status */}
            <div className="mt-4 flex items-center gap-2">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  statusCfg.dotClass,
                  liveStatus === "available" && "animate-pulse"
                )}
              />
              <span className={cn("text-sm font-medium", statusCfg.textClass)}>
                {statusCfg.label}
              </span>
              {liveNote && (
                <span className="text-xs text-muted-foreground truncate">· {liveNote}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status change card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              حالة تواجدي
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Current status display */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                statusCfg.badgeClass
              )}
            >
              <span
                className={cn(
                  "w-3 h-3 rounded-full shrink-0",
                  statusCfg.dotClass,
                  liveStatus === "available" && "animate-pulse"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", statusCfg.textClass)}>
                  {statusCfg.label}
                </p>
                {liveNote && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{liveNote}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-7 text-xs px-2.5 bg-background"
                onClick={() => setStatusOpen(true)}
              >
                <Activity className="h-3 w-3 me-1" />
                تغيير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status dialog */}
      <MyStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        currentStatus={liveStatus}
        currentNote={liveNote}
        onSuccess={refetch}
      />

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">
          الإجراءات السريعة
        </p>
        <div className="flex flex-wrap gap-3">
          {canManage ? (
            <>
              <CreateTaskDialog
                role={role}
                teams={teams}
                employeeTeamId={employeeTeamId}
              />
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/meetings">
                  <Calendar className="h-4 w-4 me-1" />
                  عقد اجتماع
                </Link>
              </Button>
              <CreateCircularDialog />
            </>
          ) : (
            <>
              <Button asChild size="sm">
                <Link href="/dashboard/assignments">
                  <FileCheck className="h-4 w-4 me-1" />
                  استلام مهمة
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/operations">
                  <LayoutDashboard className="h-4 w-4 me-1" />
                  فتح مركز العمليات
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: Alerts + Tasks ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Important notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              التنبيهات المهمة
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {unreadNotifications}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                لا توجد تنبيهات جديدة
              </p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((msg, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm rounded-md p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {msg}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" size="sm" className="w-full mt-3 text-xs">
              <Link href="/dashboard/notifications">عرض جميع الإشعارات</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Today's tasks summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              ملخص مهامي اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-bold">{taskCounts.assigned}</p>
                <p className="text-xs text-muted-foreground mt-1">المسندة</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {taskCounts.pending}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  قيد الانتظار
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {taskCounts.completedToday}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                  مكتملة اليوم
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full mt-3 text-xs">
              <Link href="/dashboard/my-tasks">عرض جميع مهامي</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Latest Announcement (compact) ───────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">📢</span>
            <span className="text-sm font-semibold text-foreground">آخر إعلان</span>
            {unreadAnnouncements > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                {unreadAnnouncements} جديد
              </Badge>
            )}
          </div>
        </div>
        <div className="px-4 py-3">
          {!latestAnnouncement ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              لا توجد إعلانات حالياً.
            </p>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {latestAnnouncement.title}
                  </p>
                  {!latestAnnouncement.is_read && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
                      جديد
                    </Badge>
                  )}
                </div>
                {latestAnnouncement.body && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-0.5">
                    {latestAnnouncement.body}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/60">
                  {new Date(latestAnnouncement.created_at).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-7 text-xs px-2.5"
                onClick={() => setAnnouncementOpen(true)}
              >
                عرض
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Announcement Viewer Dialog ───────────────────────────────────── */}
      {latestAnnouncement && (
        <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📢</span>
                <DialogTitle className="leading-snug">
                  {latestAnnouncement.title}
                </DialogTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(latestAnnouncement.created_at).toLocaleDateString("ar-SA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </DialogHeader>
            <div className="mt-2">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {latestAnnouncement.body ?? ""}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Today's Meetings ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              اجتماعات اليوم
              {todaysMeetings.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {todaysMeetings.length}
                </Badge>
              )}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
              <Link href="/dashboard/meetings">عرض الكل</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todaysMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد اجتماعات مجدولة اليوم</p>
              {canManage && (
                <Button asChild variant="ghost" size="sm" className="mt-3 text-xs">
                  <Link href="/dashboard/meetings">جدولة اجتماع</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {todaysMeetings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <MeetingPriorityBadge priority={m.priority} />
                      <MeetingStatusBadge displayStatus={m.status} />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate mb-1">
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MeetingShortTime startTime={m.start_time} endTime={m.end_time} />
                      <MeetingTypeBadge type={m.meeting_type} />
                    </div>
                    {m.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {m.location}
                      </p>
                    )}
                    {m.meeting_link && !m.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Link2 className="h-3 w-3" />
                        رابط اجتماع
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/meetings/${m.id}`}
                    className="shrink-0 text-xs text-primary hover:underline px-2 py-1 rounded border border-primary/30 hover:bg-primary/5 transition-colors whitespace-nowrap"
                  >
                    عرض التفاصيل
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
