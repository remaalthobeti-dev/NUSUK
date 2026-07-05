"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import Link from "next/link";
import type { TeamWorkloadMetrics } from "@/lib/data/analytics-executive";

interface Props {
  teams: TeamWorkloadMetrics[];
}

function truncate(name: string, len = 6) {
  return name.length > len ? name.slice(0, len) + "…" : name;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLabel(props: any) {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fill="currentColor"
      className="fill-foreground"
    >
      {value}%
    </text>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as TeamWorkloadMetrics;
  return (
    <div className="rounded-xl border bg-popover text-popover-foreground shadow-lg p-3.5 text-xs min-w-[180px]">
      <p className="font-bold text-sm mb-2 border-b pb-2">{d.teamName}</p>
      <div className="space-y-1">
        <Row label="الأعضاء"    value={`${d.memberCount} موظف`} />
        <Row label="مكتملة"     value={d.completed} accent="text-emerald-600 dark:text-emerald-400" />
        <Row label="نشطة"       value={d.active}    accent="text-blue-600 dark:text-blue-400" />
        <Row label="متأخرة"     value={d.overdue}   accent="text-red-600 dark:text-red-400" />
        <Row label="معدل الإنجاز" value={`${d.completionRate}%`} accent="text-emerald-600 dark:text-emerald-400" />
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

export function TeamWorkloadChart({ teams }: Props) {
  const sorted = [...teams].sort((a, b) => b.completionRate - a.completionRate);
  const chartData = sorted.map((t) => ({
    ...t,
    name: truncate(t.teamName),
  }));

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">أداء الفرق</h3>
          <p className="text-xs text-muted-foreground mt-0.5">نسبة إنجاز المهام لكل فريق</p>
        </div>
        <Link
          href="/dashboard/operations"
          className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5"
        >
          عرض تفاصيل الفرق ›
        </Link>
      </div>

      {/* Chart */}
      {teams.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          لا توجد بيانات
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -20, bottom: 10 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-20" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="completionRate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                <LabelList dataKey="completionRate" content={<CustomLabel />} />
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.completionRate >= 80
                        ? "#10b981"
                        : entry.completionRate >= 60
                          ? "#3b82f6"
                          : entry.completionRate >= 40
                            ? "#f59e0b"
                            : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
