"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadCirculars() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
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
        .from("notifications")
        .select("id, data")
        .eq("recipient_id", emp.id)
        .eq("type", "system")
        .eq("is_read", false)
        .limit(100);

      if (!cancelled) {
        const circulars = (data ?? []).filter(
          (n) => n.data && typeof n.data === "object" && (n.data as Record<string, unknown>).is_circular === true
        );
        setCount(circulars.length);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, []);

  return count;
}
