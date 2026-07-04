"use client";

import { useState } from "react";
import type { TeamWorkloadMetrics, WorkloadLevel } from "@/lib/data/analytics-executive";

interface Props {
  teams: TeamWorkloadMetrics[];
}

// ─── Workload level config ────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<WorkloadLevel, { label: string; dotClass: string; textClass: string }> = {
  low:      { label: "منخفض",    dotClass: "bg-emerald-500", textClass: "text-emerald-700 dark:text-emerald-400" },
  normal:   { label: "طبيعي",    dotClass: "bg-blue-500",    textClass: "text-blue-700 dark:text-blue-400" },
  high:     { label: "مرتفع",    dotClass: "bg-amber-500",   textClass: "text-amber-700 dark:text-amber-400" },
  critical: { label: "حرج",      dotClass: "bg-red-500",     textClass: "text-red-700 dark:text-red-400" },
};

// ─── Bar segments ─────────────────────────────────────────────────────────────

interface Segment {
  label: string;
  color: string;
  bgClass: string;
}

const SEGMENTS: Array<{ key: keyof TeamWorkloadMetrics; conf: Segment }> = [
  { key: "completed", conf: { label: "مكتملة",            color: "#10b981", bgClass: "bg-emerald-500" } },
  { key: "active",    conf: { label: "جارية / جديدة",     color: "#3b82f6", bgClass: "bg-blue-500"   } },
  { key: "onHold",   conf: { label: "بانتظار المراجعة",  color: "#8b5cf6", bgClass: "bg-violet-500" } },
  { key: "overdue",   conf: { label: "متأخرة",            color: "#ef4444", bgClass: "bg-red-500"    } },
  { key: "available", conf: { label: "متاحة",             color: "#6b7280", bgClass: "bg-slate-400"  } },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ team }: { team: TeamWorkloadMetrics }) {
  return (
    <div className="absolute z-50 bottom-full mb-2 start-0 min-w-[200px] rounded-xl border bg-popover text-popover-foreground shadow-lg p-3 pointer-events-none">
      <p className="font-semibold text-sm mb-2">{team.teamName}</p>
      <div className="space-y-1 text-xs">
        <Row label="الأعضاء"            value={`${team.memberCount} موظف`} />
        <Row label="جارية / جديدة"      value={team.active} accent="text-blue-600 dark:text-blue-400" />
        <Row label="مكتملة"             value={team.completed} accent="text-emerald-600 dark:text-emerald-400" />
        <Row label="بانتظار المراجعة"   value={team.onHold} accent="text-violet-600 dark:text-violet-400" />
        <Row label="متأخرة"             value={team.overdue} accent="text-red-600 dark:text-red-400" />
        <Row label="متاحة"              value={team.available} />
        <div className="border-t pt-1 mt-1">
          <Row label="معدل الإنجاز"     value={`${team.completionRate}%`} accent="text-emerald-600 dark:text-emerald-400" />
          <Row label="عبء العمل"        value={`${team.workloadScore} مهمة / عضو`} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${accent ?? ""}`}>{value}</span>
    </div>
  );
}

// ─── Single team row ──────────────────────────────────────────────────────────

function TeamRow({ team }: { team: TeamWorkloadMetrics }) {
  const [hovered, setHovered] = useState(false);
  const levelConf = LEVEL_CONFIG[team.workloadLevel];

  return (
    <div
      className="group relative flex items-center gap-4 py-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Team name */}
      <div className="w-28 xl:w-36 shrink-0 text-end">
        <p className="text-sm font-medium text-foreground truncate">{team.teamName}</p>
        <p className="text-xs text-muted-foreground">{team.memberCount} أعضاء</p>
      </div>

      {/* Stacked bar */}
      <div className="relative flex-1 h-9 rounded-lg overflow-hidden bg-muted/40 cursor-pointer">
        {team.total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            لا توجد مهام
          </div>
        ) : (
          <div className="flex h-full">
            {SEGMENTS.map(({ key, conf }) => {
              const count = team[key] as number;
              if (count === 0) return null;
              const pct = (count / team.total) * 100;
              return (
                <div
                  key={key}
                  className={`h-full transition-all duration-500 ${conf.bgClass}`}
                  style={{ width: `${pct}%` }}
                  title={`${conf.label}: ${count}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Right side: total + workload level */}
      <div className="w-24 shrink-0 flex flex-col items-start">
        <span className="text-sm font-semibold tabular-nums">{team.total} مهمة</span>
        <span className={`flex items-center gap-1 text-xs font-medium ${levelConf.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${levelConf.dotClass}`} />
          {levelConf.label}
        </span>
      </div>

      {/* Tooltip */}
      {hovered && <Tooltip team={team} />}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {SEGMENTS.map(({ conf }) => (
        <span key={conf.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${conf.bgClass}`} />
          {conf.label}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamWorkloadChart({ teams }: Props) {
  if (teams.length === 0) {
    return (
      <section>
        <SectionHeader />
        <div className="rounded-xl border bg-muted/20 py-16 text-center">
          <p className="text-sm text-muted-foreground">لا توجد فرق مسجلة بعد</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader />
      <div className="rounded-xl border bg-card p-5 space-y-1.5">
        <Legend />
        <div className="divide-y">
          {teams.map((team) => (
            <TeamRow key={team.teamId} team={team} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold">Team Workload Intelligence</h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        مرّر على أي شريط لعرض تفاصيل الفريق
      </p>
    </div>
  );
}
