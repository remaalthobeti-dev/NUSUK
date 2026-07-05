"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilityStatus } from "@/types/database";

export interface MyPresence {
  availability_status: AvailabilityStatus;
  notes: string | null;
}

export function useMyPresence() {
  const [presence, setPresence] = useState<MyPresence | null>(null);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!emp) return;

    const { data } = await supabase
      .from("employee_presence")
      .select("availability_status, notes")
      .eq("employee_id", emp.id)
      .single();

    if (data) {
      setPresence({
        availability_status: data.availability_status as AvailabilityStatus,
        notes: data.notes ?? null,
      });
    } else {
      setPresence({ availability_status: "available", notes: null });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { presence, refetch };
}
