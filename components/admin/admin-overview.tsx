"use client";

import Link from "next/link";
import {
  Users,
  Zap,
  BarChart3,
  Settings,
  Radio,
  CalendarClock,
  ListTodo,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  ChevronLeft,
  User,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AdminOverviewData, OperationsKpis } from "@/lib/data/admin";
import { STATUS_CONFIG, TEAM_EMOJI } from "@/components/dashboard/status-config";
import { MeetingShortTime } from "@/components/meetings/meeting-time";
import {
  MeetingStatusBadge,
  MeetingTypeBadge,
  MeetingPriorityBadge,
} from "@/components/meetings/meeting-badge";
import type { AvailabilityStatus, MeetingWithDetails } from "@/types/database";

// ─── Status order for presence strip ─────────────────────────────────────────

const PRESENCE_STATS: Array<{ key: AvailabilityStatus; label: string }> = [
  { key: "available",  label: "متاح" },
  { key: "busy",       label: "مشغول" },
  { key: "in_meeting", label: "في اجتماع" },
  { key: "field_work", label: "ميداني" },
  { key: "remote",     label: "عن بُعد" },
  { key: "offline",    label: "غير متاح" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminOverviewProps {
  data: AdminOverviewData;
  meetingsNow: MeetingWithDetails[];
  upcomingMeetings: MeetingWithDetails[];
  kpis: OperationsKpis;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminOverview({ data, meetingsNow, upcomingMeetings, kpis }: AdminOverviewProps) {
  const { teams, globalStats } = data;

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════════
          Section 1 — KPI command strip
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <SectionLabel icon={Zap} label="مؤشرات الأداء السريعة" />

        {/* Row A: presence */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total presence hero card */}
          <div className="col-span-1 rounded-2xl border bg-card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-primary leading-none">
                {globalStats.totalPresent}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                من {globalStats.totalEmployees} موظف
              </p>
            </div>
          </div>

          {/* Per-status breakdown */}
          {PRESENCE_STATS.map(({ key, label }) => {
            const cfg = STATUS_CONFIG[key];
            const count = globalStats.byStatus[key] ?? 0;
            const pct = globalStats.totalPresent > 0
              ? Math.round((count / globalStats.totalPresent) * 100)
              : 0;
            return (
              <div
                key={key}
                className="rounded-2xl border bg-card p-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground truncate">{label}</span>
                  <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dotClass,
                    key === "available" && "animate-pulse"
                  )} />
                </div>
                <p className={cn("text-xl font-bold tabular-nums leading-none", cfg.textClass ?? "text-foreground")}>
                  {count}
                </p>
                <div className="mt-2 space-y-1">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", cfg.bgClass)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row B: task KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            icon={ListTodo}
            label="مهام جديدة"
            value={kpis.taskPending}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
            iconColor="text-amber-600 dark:text-amber-400"
            valueColor="text-amber-700 dark:text-amber-400"
          />
          <KpiCard
            icon={PlayCircle}
            label="قيد التنفيذ"
            value={kpis.taskInProgress}
            iconBg="bg-blue-50 dark:bg-blue-950/30"
            iconColor="text-blue-600 dark:text-blue-400"
            valueColor="text-blue-700 dark:text-blue-400"
          />
          <KpiCard
            icon={PauseCircle}
            label="بانتظار المراجعة"
            value={kpis.taskOnHold}
            iconBg="bg-purple-50 dark:bg-purple-950/30"
            iconColor="text-purple-600 dark:text-purple-400"
            valueColor="text-purple-700 dark:text-purple-400"
          />
          <KpiCard
            icon={AlertTriangle}
            label="مهام متأخرة"
            value={kpis.taskOverdue}
            iconBg={kpis.taskOverdue > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-muted/50"}
            iconColor={kpis.taskOverdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}
            valueColor={kpis.taskOverdue > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}
            pulse={kpis.taskOverdue > 0}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          Section 2 — Command layout: teams + sidebar
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: Teams grid (2/3 width) ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel icon={Users} label={`الفرق (${teams.length})`} />
            <Link
              href="/dashboard/analytics"
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              تقارير مفصلة
              <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>

          {teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/10 p-16 text-center">
              <p className="text-muted-foreground text-sm">لا توجد فرق نشطة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map(({ team, employeeCount, presenceSummary, avgWorkload }) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  employeeCount={employeeCount}
                  presenceSummary={presenceSummary}
                  avgWorkload={avgWorkload}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Sidebar (1/3 width) ── */}
        <div className="space-y-4">

          {/* Live meetings */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                جارٍ الآن
              </h3>
              {meetingsNow.length > 0 && (
                <span className="ms-auto text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                  {meetingsNow.length}
                </span>
              )}
            </div>
            <div className="p-3">
              {meetingsNow.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  لا توجد اجتماعات جارية
                </p>
              ) : (
                <div className="space-y-2">
                  {meetingsNow.map((m) => (
                    <MeetingRow key={m.id} meeting={m} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming meetings */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-sky-500 shrink-0" />
              <h3 className="text-sm font-bold text-foreground">القادمة</h3>
              {upcomingMeetings.length > 0 && (
                <span className="ms-auto text-[10px] font-bold bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 rounded-full">
                  {upcomingMeetings.length}
                </span>
              )}
            </div>
            <div className="p-3">
              {upcomingMeetings.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  لا توجد اجتماعات قادمة
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingMeetings.map((m) => (
                    <MeetingRow key={m.id} meeting={m} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              الإجراءات السريعة
            </h3>
            <QuickAction
              href="/dashboard/analytics"
              icon={BarChart3}
              label="التحليلات المفصلة"
              desc="تقارير الأداء والإنجاز"
              iconBg="bg-blue-50 dark:bg-blue-950/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <QuickAction
              href="/dashboard/meetings"
              icon={CalendarClock}
              label="إدارة الاجتماعات"
              desc="جدولة ومتابعة الاجتماعات"
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <QuickAction
              href="/dashboard/settings"
              icon={Settings}
              label="إعدادات النظام"
              desc="الفرق والموظفين والصلاحيات"
              iconBg="bg-slate-100 dark:bg-slate-800"
              iconColor="text-slate-600 dark:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <h2 className="text-sm font-bold text-foreground">{label}</h2>
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  valueColor,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
        {pulse && (
          <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold tabular-nums leading-none", valueColor)}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Team card ────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  employeeCount,
  presenceSummary,
  avgWorkload,
}: {
  team: { id: string; name: string; icon: string | null; color: string; description: string | null };
  employeeCount: number;
  presenceSummary: Record<AvailabilityStatus, number>;
  avgWorkload: number;
}) {
  const emoji = TEAM_EMOJI[team.icon ?? ""] ?? "👥";
  const present = Object.values(presenceSummary).reduce((a, b) => a + b, 0);
  const presentExcludeOffline =
    (presenceSummary.available ?? 0) +
    (presenceSummary.busy ?? 0) +
    (presenceSummary.in_meeting ?? 0) +
    (presenceSummary.field_work ?? 0) +
    (presenceSummary.remote ?? 0);

  const workloadColor =
    avgWorkload >= 80 ? "bg-red-500"
    : avgWorkload >= 50 ? "bg-amber-500"
    : "bg-emerald-500";
  const workloadText =
    avgWorkload >= 80 ? "text-red-600 dark:text-red-400"
    : avgWorkload >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-400";

  const activeDots = (Object.entries(presenceSummary) as [AvailabilityStatus, number][])
    .filter(([, count]) => count > 0);

  return (
    <Link href={`/dashboard/${team.id}`} className="block group">
      <div
        className={cn(
          "rounded-2xl border bg-card overflow-hidden",
          "hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.28)]",
          "hover:-translate-y-0.5 transition-all duration-200",
        )}
      >
        {/* Color top bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: team.color }} />

        <div className="p-4 space-y-3.5">
          {/* Header: emoji + name + presence indicator */}
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 leading-none mt-0.5">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {team.name}
              </p>
              {team.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {team.description}
                </p>
              )}
            </div>
            {/* Online indicator */}
            <div className="shrink-0 text-end">
              <p className="text-lg font-bold tabular-nums text-foreground leading-none">
                {presentExcludeOffline}
              </p>
              <p className="text-[10px] text-muted-foreground">/{employeeCount} نشط</p>
            </div>
          </div>

          {/* Status dots row */}
          {activeDots.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {activeDots.map(([status, count]) => {
                const cfg = STATUS_CONFIG[status];
                return (
                  <span
                    key={status}
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      cfg.badgeClass
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass,
                      status === "available" && "animate-pulse"
                    )} />
                    {count}
                  </span>
                );
              })}
            </div>
          )}

          {/* Workload bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                متوسط عبء العمل
              </span>
              <span className={cn("font-bold tabular-nums", workloadText)}>{avgWorkload}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", workloadColor)}
                style={{ width: `${avgWorkload}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-dashed border-border/50">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {employeeCount} موظف
            </span>
            <span className="text-[11px] text-primary font-medium flex items-center gap-0.5">
              عرض الفريق
              <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Meeting row (sidebar) ────────────────────────────────────────────────────

function MeetingRow({ meeting }: { meeting: MeetingWithDetails }) {
  return (
    <Link href={`/dashboard/meetings/${meeting.id}`} className="block group">
      <div className="flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/40 transition-colors">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <MeetingPriorityBadge priority={meeting.priority} />
            <MeetingTypeBadge type={meeting.meeting_type} />
          </div>
          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {meeting.title}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <MeetingShortTime startTime={meeting.start_time} endTime={meeting.end_time} />
            {meeting.organizer && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5 truncate">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{meeting.organizer.full_name}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Quick action row ─────────────────────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
  iconBg,
  iconColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {label}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
        </div>
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/50 rtl:rotate-180 shrink-0" />
      </div>
    </Link>
  );
}
