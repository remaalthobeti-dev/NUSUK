"use client";

import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamWorkloadMetrics } from "@/lib/data/analytics-executive";

interface Props {
  teams: TeamWorkloadMetrics[];
  onRefresh: () => void;
}

const PERIODS = [
  { value: "7",  label: "آخر 7 أيام" },
  { value: "30", label: "آخر 30 يوم" },
  { value: "90", label: "آخر 3 أشهر" },
];

export function FilterPanel({ teams, onRefresh }: Props) {
  const [period, setPeriod] = useState("30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [reportType, setReportType] = useState("all");

  function handleReset() {
    setPeriod("30");
    setFromDate("");
    setToDate("");
    setSelectedTeam("all");
    setReportType("all");
  }

  return (
    <div className="w-[240px] shrink-0 space-y-2">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">فلتر التقارير</h3>
        </div>

        <div className="space-y-4">
          {/* Period */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              الفترة الزمنية
            </label>
            <div className="space-y-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all text-start",
                    period === p.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {period === p.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground shrink-0" />
                  )}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              الفترة الزمنية
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">من تاريخ</label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">إلى تاريخ</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Team */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              الفريق
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="all">الكل</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
              ))}
            </select>
          </div>

          {/* Report type */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              نوع التقرير
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="all">جميع التقارير</option>
              <option value="teams">أداء الفرق</option>
              <option value="tasks">المهام</option>
              <option value="overdue">المتأخرة</option>
            </select>
          </div>

          {/* Actions */}
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-2"
            onClick={onRefresh}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            تطبيق الفلتر
          </Button>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <RotateCcw className="h-3 w-3" />
            إعادة تعيين
          </button>
        </div>
      </div>
    </div>
  );
}
