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
  Moon,
  CheckCircle2,
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
import { EmptyState } from "@/components/shared/empty-state";
import { MyStatusDialog } from "@/components/shared/my-status-dialog";
import { STATUS_CONFIG, formatTimeAgo } from "@/components/dashboard/status-config";
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
  const [, setTick] = useState(0);
  const todayDates = useTodayDates();
  const { presence, refetch } = useMyPresence();

  // Refresh "last updated" label every minute
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

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
        <Card className="overflow-hidden">
          <CardContent className="pt-5 pb-5 relative">
            {/* Subtle brand gradient accent */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 90% 10%, hsl(var(--n-gold)) 0%, transparent 70%)",
              }}
            />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {greeting || "مرحباً"}
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-0.5 leading-snug">
              {employeeName}
            </h1>
            <p className="text-xs text-muted-foreground/80 mt-1">
              مرحبًا بعودتك، نتمنى لك يومًا مليئًا بالإنجاز.
            </p>

            {/* Dates */}
            {todayDates && (
              <div className="mt-4 rounded-xl border bg-muted/30 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Moon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <p className="text-xs font-medium text-foreground/80">{todayDates.hijri} هـ</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <p className="text-xs text-muted-foreground">{todayDates.gregorian}</p>
                </div>
              </div>
            )}

            {/* Live status */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  statusCfg.dotClass,
                  liveStatus === "available" && "animate-pulse"
                )}
              />
              <span className={cn("text-xs font-semibold", statusCfg.textClass)}>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                حالة تواجدي
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setStatusOpen(true)}
              >
                <Activity className="h-3 w-3 me-1" />
                تغيير
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Current status display */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5",
                statusCfg.badgeClass
              )}
            >
              <span className="text-2xl leading-none shrink-0">{statusCfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-base font-bold leading-tight", statusCfg.textClass)}>
                  {statusCfg.label}
                </p>
                {liveNote && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{liveNote}</p>
                )}
                {presence?.updated_at && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    آخر تحديث: {formatTimeAgo(presence.updated_at)}
                  </p>
                )}
              </div>
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
        <div className="flex flex-wrap gap-2.5">
          {canManage ? (
            <>
              <CreateTaskDialog
                role={role}
                teams={teams}
                employeeTeamId={employeeTeamId}
              />
              <Button asChild variant="outline" className="h-9 px-4 gap-2 text-sm font-medium">
                <Link href="/dashboard/meetings">
                  <Calendar className="h-4 w-4 shrink-0" />
                  عقد اجتماع
                </Link>
              </Button>
              <CreateCircularDialog teams={teams} />
            </>
          ) : (
            <>
              <Button asChild className="h-9 px-4 gap-2 text-sm font-medium">
                <Link href="/dashboard/assignments">
                  <FileCheck className="h-4 w-4 shrink-0" />
                  استلام مهمة
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9 px-4 gap-2 text-sm font-medium">
                <Link href="/dashboard/operations">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  مركز العمليات
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
              <EmptyState
                size="sm"
                icon={<CheckCircle2 />}
                title="لا توجد تنبيهات"
                description="جميع المهام والإشعارات محدّثة"
              />
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
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-3xl font-bold tabular-nums text-foreground">{taskCounts.assigned}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">المسندة</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4">
                <p className="text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {taskCounts.pending}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5 font-medium">
                  قيد الانتظار
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <p className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {taskCounts.completedToday}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1.5 font-medium">
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">📢</span>
            <span className="text-sm font-semibold text-foreground">آخر إعلان</span>
            {unreadAnnouncements > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                {unreadAnnouncements} جديد
              </Badge>
            )}
          </div>
        </div>
        <div className="px-5 py-3.5">
          {!latestAnnouncement ? (
            <p className="text-xs text-muted-foreground/60 text-center py-3">لا توجد إعلانات حالياً</p>
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
            <EmptyState
              size="sm"
              icon={<Calendar />}
              title="لا توجد اجتماعات اليوم"
              description="لم يتم جدولة أي اجتماعات لهذا اليوم"
              action={
                canManage ? (
                  <Button asChild variant="ghost" size="sm" className="text-xs h-8">
                    <Link href="/dashboard/meetings">جدولة اجتماع</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {todaysMeetings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-xl border bg-card hover:bg-accent/40 hover:shadow-sm transition-all duration-150"
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
