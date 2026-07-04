"use client";

import { useState } from "react";
import type { TaskDistributionMetrics, DistributionSlice } from "@/lib/data/analytics-executive";

interface Props {
  distribution: TaskDistributionMetrics;
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────

const RADIUS = 60;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 376.99
const CX = 88;
const CY = 88;
const GAP_PER_SEGMENT = 2; // visual gap between segments (units)

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
      <div className="w-44 h-44 flex items-center justify-center rounded-full border-2 border-dashed border-muted text-xs text-muted-foreground">
        لا بيانات
      </div>
    );
  }

  let cumulativeLength = 0;

  return (
    <svg
      width={176}
      height={176}
      viewBox={`0 0 ${CX * 2} ${CY * 2}`}
      className="overflow-visible"
    >
      {/* Background track */}
      <circle
        cx={CX}
        cy={CY}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className="text-muted/30"
      />

      {/* Segments */}
      <g transform={`rotate(-90 ${CX} ${CY})`}>
        {slices.map((slice) => {
          const segLen = (slice.count / total) * CIRCUMFERENCE - GAP_PER_SEGMENT;
          const dashArray = `${Math.max(segLen, 0)} ${CIRCUMFERENCE}`;
          const dashOffset = -(cumulativeLength);
          const isActive = activeKey === slice.key;

          const el = (
            <circle
              key={slice.key}
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={isActive ? STROKE_WIDTH + 4 : STROKE_WIDTH}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => onHover(slice.key)}
              onMouseLeave={() => onHover(null)}
              style={{ opacity: activeKey && !isActive ? 0.45 : 1 }}
            />
          );

          cumulativeLength += (slice.count / total) * CIRCUMFERENCE;
          return el;
        })}
      </g>

      {/* Center label */}
      <text
        x={CX}
        y={CY - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground font-bold text-2xl"
        fontSize={22}
        fontWeight={700}
      >
        {total}
      </text>
      <text
        x={CX}
        y={CY + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize={10}
      >
        مهمة
      </text>
    </svg>
  );
}

// ─── Legend / interactive list ────────────────────────────────────────────────

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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-all ${
        isActive
          ? "bg-muted/60 shadow-sm"
          : "hover:bg-muted/30"
      }`}
      onMouseEnter={() => onHover(slice.key)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(slice.key)}
    >
      {/* Color dot */}
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: slice.color }}
      />

      {/* Label */}
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {slice.label}
      </span>

      {/* Count */}
      <span className="text-sm font-bold tabular-nums text-foreground">
        {slice.count}
      </span>

      {/* Percentage */}
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-end">
        {slice.percentage}%
      </span>
    </button>
  );
}

// ─── KPI cards under the chart ────────────────────────────────────────────────

function DistributionKpiCards({ slices }: { slices: DistributionSlice[] }) {
  const top = slices.slice(0, 3);
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {top.map((s) => (
        <div
          key={s.key}
          className="rounded-lg border p-2.5 text-center"
          style={{ borderColor: `${s.color}40`, background: `${s.color}0d` }}
        >
          <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
            {s.count}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TaskDistributionChart({ distribution }: Props) {
  const [view, setView] = useState<"status" | "priority">("status");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const slices = view === "status" ? distribution.byStatus : distribution.byPriority;
  const activeKey = hoveredKey ?? selectedKey;

  function handleSliceClick(key: string) {
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  // Selected slice detail
  const selectedSlice = activeKey ? slices.find((s) => s.key === activeKey) : null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Task Distribution Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">اضغط على أي قطاع لتثبيت التفاصيل</p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
          {(["status", "priority"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelectedKey(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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

      <div className="rounded-xl border bg-card p-6">
        {distribution.total === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">لا توجد مهام بعد</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Donut chart */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <DonutChart
                slices={slices}
                total={distribution.total}
                activeKey={activeKey}
                onHover={setHoveredKey}
              />

              {/* Selected slice detail box */}
              {selectedSlice && (
                <div
                  className="rounded-lg px-4 py-2.5 text-center text-sm min-w-[140px] border"
                  style={{
                    borderColor: `${selectedSlice.color}50`,
                    background: `${selectedSlice.color}12`,
                  }}
                >
                  <p className="font-bold text-xl tabular-nums" style={{ color: selectedSlice.color }}>
                    {selectedSlice.count}
                  </p>
                  <p className="text-xs text-foreground font-medium">{selectedSlice.label}</p>
                  <p className="text-xs text-muted-foreground">{selectedSlice.percentage}% من الإجمالي</p>
                </div>
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

              <DistributionKpiCards slices={slices} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
