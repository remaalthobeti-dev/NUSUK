"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { HeroMetricsSection } from "./hero-metrics";
import { TeamWorkloadChart } from "./team-workload-chart";
import { TaskDistributionChart } from "./task-distribution-chart";
import { TrendChart } from "./trend-chart";
import { TopTeamsPanel } from "./top-teams-panel";
import { OverdueTasksPanel } from "./overdue-tasks-panel";
import { KpiIndicatorsPanel } from "./kpi-indicators-panel";
import { FilterPanel } from "./filter-panel";
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
    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsRefreshing(true);
        router.refresh();
      }, 600);
    };

    const filter =
      data.viewerTeamId && data.viewerRole !== "super_admin"
        ? `team_id=eq.${data.viewerTeamId}`
        : undefined;

    const channel = supabase
      .channel("exec-analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", ...(filter ? { filter } : {}) }, trigger)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router, data.viewerTeamId, data.viewerRole]);

  function formatTime(d: Date) {
    return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Live status bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2 shrink-0">
            {isRefreshing ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse" />
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            )}
          </span>
          {isRefreshing ? "جاري التحديث…" : `آخر تحديث: ${formatTime(lastUpdated)}`}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          تحديث يدوي
        </button>
      </div>

      {/* ── Main layout: filter sidebar + content ── */}
      <div className="flex gap-5 items-start">
        {/* Filter panel (right side in RTL = first in DOM) */}
        <FilterPanel teams={data.teamWorkloads} onRefresh={handleRefresh} />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Row 1: 5 KPI cards */}
          <HeroMetricsSection metrics={data.heroMetrics} teamCount={data.teamCount} />

          {/* Row 2: 3 charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <TeamWorkloadChart teams={data.teamWorkloads} />
            <TaskDistributionChart distribution={data.taskDistribution} />
            <TrendChart trendData={data.trendData} />
          </div>

          {/* Row 3: 3 bottom panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <TopTeamsPanel teams={data.teamWorkloads} />
            <OverdueTasksPanel tasks={data.overdueTaskDetails} />
            <KpiIndicatorsPanel metrics={data.heroMetrics} teams={data.teamWorkloads} />
          </div>
        </div>
      </div>
    </div>
  );
}
