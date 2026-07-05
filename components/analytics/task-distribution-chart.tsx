"use client";

import Link from "next/link";
import { useState } from "react";
import type { TaskDistributionMetrics, DistributionSlice } from "@/lib/data/analytics-executive";

interface Props {
  distribution: TaskDistributionMetrics;
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────

const RADIUS = 56;
const STROKE = 18;
const CIRC = 2 * Math.PI * RADIUS;
const CX = 80;
const CY = 80;
const GAP = 2.5;

function DonutChart({
  slices,
  total,
  activeKey,
  onHover,
}: {
  slices: DistributionSlice[];
  total: number;
  activeKey: string | null;
  onHover: (k: string | null) => void;
}) {
  if (total === 0) return (
    <div className="w-40 h-40 rounded-full border-2 border-dashed border-muted flex items-center justify-center text-xs text-muted-foreground">
      لا بيانات
    </div>
  );

  let cum = 0;
  return (
    <svg width={160} height={160} viewBox={`0 0 ${CX * 2} ${CY * 2}`} className="overflow-visible shrink-0">
      <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-muted/20" />
      <g transform={`rotate(-90 ${CX} ${CY})`}>
        {slices.map((s) => {
          const seg = (s.count / total) * CIRC - GAP;
          const el = (
            <circle
              key={s.key}
              cx={CX} cy={CY} r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={activeKey === s.key ? STROKE + 4 : STROKE}
              strokeDasharray={`${Math.max(seg, 0)} ${CIRC}`}
              strokeDashoffset={-cum}
              className="transition-all duration-300 cursor-pointer"
              style={{ opacity: activeKey && activeKey !== s.key ? 0.4 : 1 }}
              onMouseEnter={() => onHover(s.key)}
              onMouseLeave={() => onHover(null)}
            />
          );
          cum += (s.count / total) * CIRC;
          return el;
        })}
      </g>
      <text x={CX} y={CY - 7} textAnchor="middle" fontSize={22} fontWeight={800} className="fill-foreground">{total}</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize={10} className="fill-muted-foreground">مهمة</text>
    </svg>
  );
}

function SliceRow({ slice, isActive, onHover }: {
  slice: DistributionSlice;
  isActive: boolean;
  onHover: (k: string | null) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors cursor-default ${isActive ? "bg-muted/50" : "hover:bg-muted/30"}`}
      onMouseEnter={() => onHover(slice.key)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
      <span className="flex-1 text-xs text-foreground truncate">{slice.label}</span>
      <span className="text-xs font-bold tabular-nums text-foreground">{slice.count}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-end">{slice.percentage}%</span>
    </div>
  );
}

export function TaskDistributionChart({ distribution }: Props) {
  const [view, setView] = useState<"status" | "priority">("status");
  const [hovered, setHovered] = useState<string | null>(null);

  const slices = view === "status" ? distribution.byStatus : distribution.byPriority;

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">توزيع المهام حسب الحالة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">نسبة كل حالة من إجمالي المهام</p>
        </div>
        <Link
          href="/dashboard/assignments"
          className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5"
        >
          عرض جميع المهام ›
        </Link>
      </div>

      {/* Toggle */}
      <div className="flex gap-1 bg-muted/40 rounded-lg p-0.5 mb-4 self-start">
        {(["status", "priority"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "status" ? "الحالة" : "الأولوية"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex items-start gap-4 flex-1">
        <DonutChart slices={slices} total={distribution.total} activeKey={hovered} onHover={setHovered} />
        <div className="flex-1 min-w-0 space-y-0.5 mt-1">
          {slices.map((s) => (
            <SliceRow key={s.key} slice={s} isActive={hovered === s.key} onHover={setHovered} />
          ))}
        </div>
      </div>
    </div>
  );
}
