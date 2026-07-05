"use client";

import { useState } from "react";
import type { TaskDistributionMetrics, DistributionSlice } from "@/lib/data/analytics-executive";

interface Props {
  distribution: TaskDistributionMetrics;
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────

const RADIUS = 62;
const STROKE_WIDTH = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CX = 90;
const CY = 90;
const GAP_PER_SEGMENT = 2.5;

function DonutChart({
  slices,
  total,
  activeKey,
  onHover,
}: {
  slices: DistributionSlice[];
  total: number;
  activeKey: string | null;
  onHover: (key: string | null) => void;
}) {
  if (total === 0) {
    return (
      <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full border-2 border-dashed border-muted text-xs text-muted-foreground">
        لا بيانات
      </div>
    );
  }

  let cumulativeLength = 0;

  return (
    <svg width={180} height={180} viewBox={`0 0 ${CX * 2} ${CY * 2}`} className="overflow-visible">
      {/* Track */}
      <circle
        cx={CX}
        cy={CY}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className="text-muted/25"
      />

      <g transform={`rotate(-90 ${CX} ${CY})`}>
        {slices.map((slice) => {
          const segLen = (slice.count / total) * CIRCUMFERENCE - GAP_PER_SEGMENT;
          const dashArray = `${Math.max(segLen, 0)} ${CIRCUMFERENCE}`;
          const dashOffset = -cumulativeLength;
          const isActive = activeKey === slice.key;

          const el = (
            <circle
              key={slice.key}
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={isActive ? STROKE_WIDTH + 5 : STROKE_WIDTH}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => onHover(slice.key)}
              onMouseLeave={() => onHover(null)}
              style={{ opacity: activeKey && !isActive ? 0.4 : 1 }}
            />
          );

          cumulativeLength += (slice.count / total) * CIRCUMFERENCE;
          return el;
        })}
      </g>

      {/* Center */}
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
        fontSize={26}
        fontWeight={800}
      >
        {total}
      </text>
      <text
        x={CX}
        y={CY + 13}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize={11}
      >
        مهمة
      </text>
    </svg>
  );
}

// ─── Slice row ────────────────────────────────────────────────────────────────

function SliceRow({
  slice,
  isActive,
  onHover,
  onClick,
}: {
  slice: DistributionSlice;
  isActive: boolean;
  onHover: (key: string | null) => void;
  onClick: (key: string) => void;
}) {
  return (
    <button
      type="button"
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-all duration-150 ${
        isActive ? "bg-muted/60 shadow-sm" : "hover:bg-muted/30"
      }`}
      onMouseEnter={() => onHover(slice.key)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(slice.key)}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: slice.color }}
      />
      <span className="flex-1 text-sm font-medium text-foreground truncate">{slice.label}</span>
      <span className="text-base font-bold tabular-nums text-foreground">{slice.count}</span>
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-end">
        {slice.percentage}%
      </span>
    </button>
  );
}

// ─── Mini top-3 KPI strip ─────────────────────────────────────────────────────

function TopSliceStrip({ slices }: { slices: DistributionSlice[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {slices.slice(0, 3).map((s) => (
        <div
          key={s.key}
          className="rounded-xl border p-2.5 text-center transition-shadow hover:shadow-sm"
          style={{ borderColor: `${s.color}35`, background: `${s.color}0c` }}
        >
          <p className="text-xl font-bold tabular-nums" style={{ color: s.color }}>
            {s.count}
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TaskDistributionChart({ distribution }: Props) {
  const [view, setView] = useState<"status" | "priority">("status");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const slices = view === "status" ? distribution.byStatus : distribution.byPriority;
  const activeKey = hoveredKey ?? selectedKey;

  const selectedSlice = activeKey ? slices.find((s) => s.key === activeKey) : null;

  function handleSliceClick(key: string) {
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  return (
    <section>
      {/* Section header */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">توزيع المهام</h2>
          <p className="text-xs text-muted-foreground mt-0.5">اضغط على أي قطاع لتثبيت التفاصيل</p>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 shrink-0">
          {(["status", "priority"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelectedKey(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "status" ? "حسب الحالة" : "حسب الأولوية"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        {distribution.total === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">لا توجد مهام بعد</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Donut + detail */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <DonutChart
                slices={slices}
                total={distribution.total}
                activeKey={activeKey}
                onHover={setHoveredKey}
              />

              {selectedSlice ? (
                <div
                  className="rounded-xl px-4 py-3 text-center min-w-[150px] border transition-all duration-200"
                  style={{
                    borderColor: `${selectedSlice.color}45`,
                    background: `${selectedSlice.color}10`,
                  }}
                >
                  <p className="font-bold text-2xl tabular-nums" style={{ color: selectedSlice.color }}>
                    {selectedSlice.count}
                  </p>
                  <p className="text-xs text-foreground font-semibold mt-0.5">{selectedSlice.label}</p>
                  <p className="text-xs text-muted-foreground">{selectedSlice.percentage}% من الإجمالي</p>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center">
                  مرّر أو اضغط على قطاع
                </p>
              )}
            </div>

            {/* Slice list */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {slices.map((slice) => (
                <SliceRow
                  key={slice.key}
                  slice={slice}
                  isActive={activeKey === slice.key}
                  onHover={setHoveredKey}
                  onClick={handleSliceClick}
                />
              ))}
              <TopSliceStrip slices={slices} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
