"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  WifiOff,
  Wifi,
  Bell,
  Calendar,
  LayoutDashboard,
  FileCheck,
  ListTodo,
  AlertCircle,
  Link2,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateMyStatusAction } from "@/app/(dashboard)/dashboard/actions";
import {
  MeetingTypeBadge,
  MeetingStatusBadge,
  MeetingPriorityBadge,
} from "@/components/meetings/meeting-badge";
import { MeetingShortTime } from "@/components/meetings/meeting-time";
import { CreateTaskDialog } from "@/components/assignments/create-task-dialog";
import { CreateCircularDialog } from "@/components/home/create-circular-dialog";
import type { AvailabilityStatus, UserRole, MeetingWithDetails, Team } from "@/types/database";

export interface LatestCircular {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  is_read: boolean;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{
  value: AvailabilityStatus;
  label: string;
  Icon: React.ElementType;
  dot: string;
  activeClass: string;
}> = [
  {
    value: "available",
    label: "متاح",
    Icon: CheckCircle2,
    dot: "bg-emerald-500",
    activeClass: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "busy",
    label: "مشغول",
    Icon: Clock,
    dot: "bg-amber-500",
    activeClass: "bg-amber-600 text-white border-amber-600",
  },
  {
    value: "in_meeting",
    label: "في اجتماع",
    Icon: Users,
    dot: "bg-blue-500",
    activeClass: "bg-blue-600 text-white border-blue-600",
  },
  {
    value: "field_work",
    label: "عمل ميداني",
    Icon: MapPin,
    dot: "bg-purple-500",
    activeClass: "bg-purple-600 text-white border-purple-600",
  },
  {
    value: "remote",
    label: "عن بعد",
    Icon: Wifi,
    dot: "bg-cyan-500",
    activeClass: "bg-cyan-600 text-white border-cyan-600",
  },
  {
    value: "offline",
    label: "خارج الدوام",
    Icon: WifiOff,
    dot: "bg-slate-400",
    activeClass: "bg-slate-600 text-white border-slate-600",
  },
];

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
  latestCircular: LatestCircular | null;
  unreadCirculars: number;
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
  latestCircular,
  unreadCirculars,
}: HomeClientProps) {
  const [greeting, setGreeting] = useState<string>("");
  const [status, setStatus] = useState<AvailabilityStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("صباح الخير");
    else if (hour >= 12 && hour < 18) setGreeting("مساء الخير");
    else setGreeting("مساء النور");
  }, []);

  function handleStatusChange(next: AvailabilityStatus) {
    if (next === status || isPending) return;
    setStatus(next);
    startTransition(async () => {
      await updateMyStatusAction(next);
    });
  }

  const currentOpt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
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
            <div className="mt-4 flex items-center gap-2">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  currentOpt.dot
                )}
              />
              <span className="text-sm font-medium text-foreground">
                {currentOpt.label}
              </span>
              {isPending && (
                <span className="text-xs text-muted-foreground">
                  جاري التحديث…
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              تغيير الحالة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const { Icon } = opt;
                const isActive = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-60",
                      isActive
                        ? opt.activeClass
                        : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs"
            >
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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs"
            >
              <Link href="/dashboard/my-tasks">عرض جميع مهامي</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Latest Circular ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              آخر تعميم
              {unreadCirculars > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {unreadCirculars} جديد
                </Badge>
              )}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
              <Link href="/dashboard/notifications">عرض الكل</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!latestCircular ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد تعاميم حالياً
            </p>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground leading-snug flex-1">
                  {latestCircular.title}
                </p>
                {!latestCircular.is_read && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                    جديد
                  </Badge>
                )}
              </div>
              {latestCircular.body && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {latestCircular.body}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground/70">
                {new Date(latestCircular.created_at).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                    {/* Priority + Status row */}
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <MeetingPriorityBadge priority={m.priority} />
                      <MeetingStatusBadge displayStatus={m.status} />
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-foreground truncate mb-1">
                      {m.title}
                    </p>

                    {/* Time + Type */}
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

                  {/* View Details button */}
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
