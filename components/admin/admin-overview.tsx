"use client";

import Link from "next/link";
import {
  Users,
  Zap,
  ListTodo,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminOverviewData, OperationsKpis } from "@/lib/data/admin";
import { STATUS_CONFIG, TEAM_EMOJI } from "@/components/dashboard/status-config";
import type { AvailabilityStatus } from "@/types/database";
import type { PressureLevel } from "@/components/home/factory-home-client";

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
  kpis: OperationsKpis;
  factoryPressure?: { level: PressureLevel; updated_at: string } | null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminOverview({ data, kpis, factoryPressure }: AdminOverviewProps) {
  const { teams, globalStats } = data;

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════════
          Factory Pressure Banner
      ══════════════════════════════════════════════════════ */}
      <FactoryPressureBanner pressure={factoryPressure ?? null} />

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
          Section 2 — Teams grid (full width)
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-3">
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
          <EmptyStateBox icon="👥" title="لا توجد فرق نشطة" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </section>
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

// ─── Factory Pressure Banner ──────────────────────────────────────────────────

const PRESSURE_AR: Record<PressureLevel, { label: string; emoji: string; bg: string; border: string; text: string; bar: string; barWidth: string }> = {
  low:    { label: "منخفض", emoji: "🟢", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500", barWidth: "30%" },
  medium: { label: "متوسط", emoji: "🟡", bg: "bg-amber-50 dark:bg-amber-950/20",   border: "border-amber-200 dark:border-amber-800",   text: "text-amber-700 dark:text-amber-400",   bar: "bg-amber-500",   barWidth: "65%" },
  high:   { label: "عالي",  emoji: "🔴", bg: "bg-red-50 dark:bg-red-950/20",       border: "border-red-200 dark:border-red-800",       text: "text-red-700 dark:text-red-400",       bar: "bg-red-500",     barWidth: "95%" },
};

function FactoryPressureBanner({ pressure }: { pressure: { level: PressureLevel; updated_at: string } | null }) {
  const ago = (() => {
    if (!pressure) return null;
    const diff = Math.floor((Date.now() - new Date(pressure.updated_at).getTime()) / 60000);
    if (diff < 1) return "الآن";
    if (diff < 60) return `منذ ${diff} دقيقة`;
    return `منذ ${Math.floor(diff / 60)} ساعة`;
  })();

  const cfg = pressure ? PRESSURE_AR[pressure.level] : null;

  return (
    <div className={cn(
      "rounded-2xl border p-4 flex items-center gap-4",
      cfg ? cn(cfg.bg, cfg.border) : "bg-muted/30 border-border"
    )}>
      {/* Icon */}
      <div className="shrink-0 w-11 h-11 rounded-xl bg-white/60 dark:bg-black/20 border border-white/40 flex items-center justify-center text-2xl shadow-sm">
        🏭
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ضغط المصنع</p>
          {ago && (
            <span className="text-[10px] text-muted-foreground bg-background/60 border border-border/50 rounded-full px-2 py-0.5">
              {ago}
            </span>
          )}
        </div>
        {cfg && pressure ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base leading-none">{cfg.emoji}</span>
              <p className={cn("text-lg font-bold", cfg.text)}>{cfg.label}</p>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden w-full max-w-[200px]">
              <div
                className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                style={{ width: cfg.barWidth }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">لم يتم تحديد مستوى الضغط بعد</p>
        )}
      </div>
    </div>
  );
}

function EmptyStateBox({ icon, title }: { icon: string; title: string }) {
  return (
    <div
      className="rounded-2xl border border-dashed p-12 text-center flex flex-col items-center gap-3"
      style={{ borderColor: "hsl(var(--n-gold) / .18)", background: "hsl(var(--n-gold) / .02)" }}
    >
      <span className="text-3xl opacity-40">{icon}</span>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
    </div>
  );
}
