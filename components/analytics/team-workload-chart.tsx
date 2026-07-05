"use client";

import { useState } from "react";
import type { TeamWorkloadMetrics, WorkloadLevel } from "@/lib/data/analytics-executive";

interface Props {
  teams: TeamWorkloadMetrics[];
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<WorkloadLevel, {
  label: string;
  dotClass: string;
  textClass: string;
  bgClass: string;
}> = {
  low:      { label: "منخفض",  dotClass: "bg-emerald-500", textClass: "text-emerald-700 dark:text-emerald-400", bgClass: "bg-emerald-100 dark:bg-emerald-950/40" },
  normal:   { label: "طبيعي",  dotClass: "bg-blue-500",    textClass: "text-blue-700 dark:text-blue-400",       bgClass: "bg-blue-100 dark:bg-blue-950/40" },
  high:     { label: "مرتفع",  dotClass: "bg-amber-500",   textClass: "text-amber-700 dark:text-amber-400",     bgClass: "bg-amber-100 dark:bg-amber-950/40" },
  critical: { label: "حرج",    dotClass: "bg-red-500",     textClass: "text-red-700 dark:text-red-400",         bgClass: "bg-red-100 dark:bg-red-950/40" },
};

// ─── Bar segments ─────────────────────────────────────────────────────────────

const SEGMENTS: Array<{ key: keyof TeamWorkloadMetrics; label: string; barClass: string; color: string }> = [
  { key: "completed", label: "مكتملة",           barClass: "bg-emerald-500", color: "#10b981" },
  { key: "active",    label: "جارية / جديدة",    barClass: "bg-blue-500",   color: "#3b82f6" },
  { key: "onHold",    label: "قيد المراجعة",     barClass: "bg-violet-500", color: "#8b5cf6" },
  { key: "overdue",   label: "متأخرة",           barClass: "bg-red-500",    color: "#ef4444" },
  { key: "available", label: "متاحة",            barClass: "bg-slate-300 dark:bg-slate-600",  color: "#94a3b8" },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function TeamTooltip({ team }: { team: TeamWorkloadMetrics }) {
  return (
    <div className="absolute z-50 bottom-full mb-2 start-0 min-w-[210px] rounded-xl border bg-popover text-popover-foreground shadow-xl p-3.5 pointer-events-none">
      <p className="font-bold text-sm mb-2.5 border-b pb-2">{team.teamName}</p>
      <div className="space-y-1.5 text-xs">
        <Row label="الأعضاء"           value={`${team.memberCount} موظف`} />
        <Row label="جارية / جديدة"     value={team.active}     accent="text-blue-600 dark:text-blue-400" />
        <Row label="مكتملة"            value={team.completed}  accent="text-emerald-600 dark:text-emerald-400" />
        <Row label="قيد المراجعة"      value={team.onHold}     accent="text-violet-600 dark:text-violet-400" />
        <Row label="متأخرة"            value={team.overdue}    accent="text-red-600 dark:text-red-400" />
        <Row label="متاحة"             value={team.available} />
        <div className="border-t pt-1.5 mt-1">
          <Row label="معدل الإنجاز"    value={`${team.completionRate}%`} accent="text-emerald-600 dark:text-emerald-400" />
          <Row label="عبء العمل"       value={`${team.workloadScore} مهمة / عضو`} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${accent ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

// ─── Single team row ──────────────────────────────────────────────────────────

function TeamRow({ team }: { team: TeamWorkloadMetrics }) {
  const [hovered, setHovered] = useState(false);
  const levelConf = LEVEL_CONFIG[team.workloadLevel];

  return (
    <div
      className="group relative flex items-center gap-4 py-3.5 border-b last:border-b-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Team name + member count */}
      <div className="w-32 xl:w-40 shrink-0 text-end">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{team.teamName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{team.memberCount} أعضاء</p>
      </div>

      {/* Progress bar */}
      <div className="relative flex-1 h-7 rounded-lg overflow-hidden bg-muted/40 cursor-pointer">
        {team.total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground px-3">
            لا توجد مهام
          </div>
        ) : (
          <div className="flex h-full">
            {SEGMENTS.map(({ key, barClass }) => {
              const count = team[key] as number;
              if (count === 0) return null;
              const pct = (count / team.total) * 100;
              return (
                <div
                  key={key}
                  className={`h-full transition-all duration-500 ${barClass}`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Completion rate + workload badge */}
      <div className="w-28 shrink-0 flex items-center justify-between gap-2">
        <div className="text-start">
          <p className="text-base font-bold tabular-nums text-foreground leading-tight">
            {team.completionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">إنجاز</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelConf.bgClass} ${levelConf.textClass}`}
        >
          {levelConf.label}
        </span>
      </div>

      {/* Tooltip */}
      {hovered && <TeamTooltip team={team} />}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function BarLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
      {SEGMENTS.map(({ label, barClass }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${barClass}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TeamWorkloadChart({ teams }: Props) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">أداء الفرق</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            نسبة إنجاز المهام لكل فريق — مرّر على الشريط للتفاصيل
          </p>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-xl border bg-muted/20 py-16 text-center">
          <p className="text-sm text-muted-foreground">لا توجد فرق مسجلة بعد</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-5">
          <BarLegend />
          <div className="mt-3">
            {teams.map((team) => (
              <TeamRow key={team.teamId} team={team} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
