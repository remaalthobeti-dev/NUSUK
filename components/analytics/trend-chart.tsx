"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/lib/data/analytics-executive";

interface Props {
  trendData: TrendPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover text-popover-foreground shadow-lg p-3 text-xs min-w-[150px]">
      <p className="font-semibold mb-1.5 border-b pb-1.5">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </span>
          <span className="font-bold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ trendData }: Props) {
  const hasData = trendData.some((p) => p.completed > 0 || p.created > 0);

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">اتجاه الأداء</h3>
          <p className="text-xs text-muted-foreground mt-0.5">مقارنة أداء المهام خلال الفترة</p>
        </div>
        <Link
          href="/dashboard/my-tasks"
          className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5"
        >
          عرض التحليل الكامل ›
        </Link>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          لا توجد بيانات تاريخية كافية
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={trendData}
              margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(val) => (
                  <span className="text-[11px] text-muted-foreground">
                    {val === "completed" ? "المهام المكتملة" : "المهام المُنشأة"}
                  </span>
                )}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="completed"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="created"
                name="created"
                stroke="#c9963e"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                dot={{ fill: "#c9963e", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
