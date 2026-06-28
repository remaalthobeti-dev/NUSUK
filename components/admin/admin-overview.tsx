"use client";

import Link from "next/link";
import { Users, Zap, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AdminOverviewData } from "@/lib/data/admin";
import { STATUS_CONFIG, TEAM_EMOJI } from "@/components/dashboard/status-config";
import type { AvailabilityStatus } from "@/types/database";

const GLOBAL_STATS_ORDER: Array<{
  key: AvailabilityStatus;
  label: string;
}> = [
  { key: "available", label: "متاح" },
  { key: "busy", label: "مشغول" },
  { key: "break", label: "استراحة" },
  { key: "meeting", label: "اجتماع" },
  { key: "remote", label: "عن بُعد" },
  { key: "outside_office", label: "خارج" },
];

interface AdminOverviewProps {
  data: AdminOverviewData;
}

export function AdminOverview({ data }: AdminOverviewProps) {
  const { teams, globalStats } = data;

  return (
    <>
      {/* ── Global Stats Bar ─────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          إجمالي الموظفين اليوم
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Total card */}
          <div className="col-span-1 rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-primary">إجمالي الحضور</span>
            <span className="text-3xl font-bold text-primary mt-2">
              {globalStats.totalPresent}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              من {globalStats.totalEmployees} موظف
            </span>
          </div>

          {/* Per-status breakdown */}
          {GLOBAL_STATS_ORDER.map(({ key, label }) => {
            const cfg = STATUS_CONFIG[key];
            const count = globalStats.byStatus[key] ?? 0;
            const pct =
              globalStats.totalPresent > 0
                ? Math.round((count / globalStats.totalPresent) * 100)
                : 0;
            return (
              <div
                key={key}
                className="rounded-2xl border bg-white/70 dark:bg-slate-900/70 p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                  <span
                    className={cn("w-2.5 h-2.5 rounded-full shrink-0", cfg.dotClass)}
                  />
                </div>
                <span
                  className={cn(
                    "text-2xl font-bold mt-2",
                    cfg.textClass ?? "text-foreground"
                  )}
                >
                  {count}
                </span>
                <div className="mt-2 space-y-1">
                  <Progress
                    value={pct}
                    className="h-1"
                    indicatorClassName={cfg.dotClass.replace("bg-", "bg-")}
                  />
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Quick Actions ────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/analytics">
            <BarChart3 className="h-4 w-4" />
            التحليلات المفصلة
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            إعدادات النظام
          </Link>
        </Button>
      </div>

      {/* ── Teams Grid ───────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          الفرق ({teams.length})
        </h2>

        {teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-16 text-center">
            <p className="text-muted-foreground">لا توجد فرق نشطة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {teams.map(({ team, employeeCount, presenceSummary, avgWorkload }) => (
              <AdminTeamCard
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
    </>
  );
}

// ── Admin Team Card ─────────────────────────────────────

function AdminTeamCard({
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

  const workloadColor =
    avgWorkload >= 80 ? "bg-red-500" : avgWorkload >= 50 ? "bg-amber-500" : "bg-green-500";
  const workloadText =
    avgWorkload >= 80
      ? "text-red-600 dark:text-red-400"
      : avgWorkload >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-green-600 dark:text-green-400";

  return (
    <Link href={`/dashboard/${team.id}`} className="block group">
      <div
        className={cn(
          "rounded-2xl border bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-5",
          "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
          "border-t-4"
        )}
        style={{ borderTopColor: team.color }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">{team.name}</p>
            {team.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {team.description}
              </p>
            )}
          </div>
        </div>

        {/* Present / Total */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-2xl font-bold text-foreground">{present}</span>
          <span className="text-sm text-muted-foreground">/ {employeeCount} حاضر</span>
        </div>

        {/* Status dots row */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {(Object.entries(presenceSummary) as [AvailabilityStatus, number][])
            .filter(([, count]) => count > 0)
            .map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <span
                  key={status}
                  className={cn(
                    "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                    cfg.badgeClass
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotClass)} />
                  {count}
                </span>
              );
            })}
        </div>

        {/* Workload bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              متوسط عبء العمل
            </span>
            <span className={cn("font-bold", workloadText)}>{avgWorkload}%</span>
          </div>
          <Progress
            value={avgWorkload}
            className="h-1.5"
            indicatorClassName={cn("transition-all duration-700", workloadColor)}
          />
        </div>

        {/* Employee count */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {employeeCount} موظف
          </span>
          <span className="text-[11px] text-primary font-medium me-auto">
            عرض الفريق ←
          </span>
        </div>
      </div>
    </Link>
  );
}
