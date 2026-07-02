"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to teams table changes and refreshes server data on any mutation.
 * Teams list is server-rendered, so we simply call router.refresh() on changes
 * instead of maintaining a full client-side mirror.
 */
export function useRealtimeTeams() {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("teams-management-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);
}
