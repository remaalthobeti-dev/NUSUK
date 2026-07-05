"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Download, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { HeroMetricsSection } from "./hero-metrics";
import { LiveInsightsSection } from "./live-insights";
import { TeamWorkloadChart } from "./team-workload-chart";
import { TaskDistributionChart } from "./task-distribution-chart";
import type { ExecutiveAnalyticsData } from "@/lib/data/analytics-executive";

interface Props {
  data: ExecutiveAnalyticsData;
}

export function ExecutiveClient({ data }: Props) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(data.generatedAt));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
  }, [router]);

  useEffect(() => {
    setLastUpdated(new Date(data.generatedAt));
    setIsRefreshing(false);
  }, [data.generatedAt]);

  // Realtime: refresh on task changes
  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setIsRefreshing(true);
        router.refresh();
      }, 600);
    };

    const filter =
      data.viewerTeamId && data.viewerRole !== "super_admin"
        ? `team_id=eq.${data.viewerTeamId}`
        : undefined;

    const channel = supabase
      .channel("executive-analytics-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", ...(filter ? { filter } : {}) },
        trigger
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [router, data.viewerTeamId, data.viewerRole]);

  async function handleExcelExport() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["المؤشر", "القيمة"],
      ["إجمالي المهام", data.heroMetrics.totalTasks],
      ["معدل الإنجاز %", data.heroMetrics.completionRate],
      ["المهام النشطة", data.heroMetrics.activeTasks],
      ["المهام المتأخرة", data.heroMetrics.overdueTasks],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "ملخص");
    XLSX.writeFile(wb, `تقرير-نسك-${new Date().toLocaleDateString("ar-SA")}.xlsx`);
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ── Top control bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Live status indicator */}
        <div className="flex items-center gap-2.5 text-sm">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {isRefreshing ? (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 animate-pulse" />
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </>
            )}
          </span>
          <span className="text-muted-foreground text-xs">
            {isRefreshing
              ? "جاري التحديث…"
              : `آخر تحديث: ${formatTime(lastUpdated)}`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={handleExcelExport}
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            تصدير Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            طباعة
          </Button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 h-8 px-2.5 rounded-lg border border-border hover:bg-muted/50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <HeroMetricsSection metrics={data.heroMetrics} />

      {/* ── Live insights ── */}
      <LiveInsightsSection insights={data.insights} />

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TeamWorkloadChart teams={data.teamWorkloads} />
        <TaskDistributionChart distribution={data.taskDistribution} />
      </div>
    </div>
  );
}
