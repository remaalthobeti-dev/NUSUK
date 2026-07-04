"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
    // The refresh indicator clears when the new data arrives (generatedAt changes)
  }, [router]);

  // Track when data refreshes
  useEffect(() => {
    setLastUpdated(new Date(data.generatedAt));
    setIsRefreshing(false);
  }, [data.generatedAt]);

  // Supabase Realtime: refresh when any task changes
  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setIsRefreshing(true);
        router.refresh();
      }, 600); // debounce rapid updates
    };

    // For track_manager: filter by their team
    const filter = data.viewerTeamId && data.viewerRole !== "super_admin"
      ? `team_id=eq.${data.viewerTeamId}`
      : undefined;

    const channel = supabase
      .channel("executive-analytics-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          ...(filter ? { filter } : {}),
        },
        trigger
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [router, data.viewerTeamId, data.viewerRole]);

  // Format last updated time
  function formatTime(d: Date) {
    return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <div className="space-y-8">
      {/* ── Status bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`relative flex h-2 w-2`}>
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
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          تحديث يدوي
        </button>
      </div>

      {/* ── Hero metrics ── */}
      <HeroMetricsSection metrics={data.heroMetrics} />

      {/* ── Live insights ── */}
      <LiveInsightsSection insights={data.insights} />

      {/* ── Team workload ── */}
      <TeamWorkloadChart teams={data.teamWorkloads} />

      {/* ── Task distribution ── */}
      <TaskDistributionChart distribution={data.taskDistribution} />
    </div>
  );
}
