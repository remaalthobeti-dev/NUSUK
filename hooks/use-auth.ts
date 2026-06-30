"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Employee } from "@/types/database";

interface AuthState {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    employee: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchEmployee(userId: string): Promise<Employee | null> {
      const { data, error } = await supabase
        .from("employees")
        .select("*, team:teams(*)")
        .eq("user_id", userId)
        .single();
      // Q3 + Q4: did the query succeed, and is role present?
      console.log(
        `[useAuth] employees query — userId="${userId}"`,
        `id="${(data as Record<string, unknown> | null)?.id ?? "null"}"`,
        `role="${(data as Record<string, unknown> | null)?.role ?? "null"}"`,
        `error="${error?.message ?? "none"}" code="${error?.code ?? "none"}"`
      );
      return data as Employee | null;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // Q1 + Q2: what event fired, and does getUser() agree on the user?
      console.log(
        `[useAuth] onAuthStateChange — event="${event}"`,
        `session.user.id="${session?.user?.id ?? "null"}"`
      );
      supabase.auth.getUser().then(({ data: { user } }) => {
        console.log(`[useAuth] getUser() cross-check — user.id="${user?.id ?? "null"}"`);
      });

      if (session?.user) {
        const employee = await fetchEmployee(session.user.id);
        // Q4: what role is being written into state?
        console.log(
          `[useAuth] setState — role="${employee?.role ?? "null"}"`,
          `id="${employee?.id ?? "null"}" loading=false`
        );
        if (!cancelled) setState({ user: session.user, employee, loading: false });
      } else {
        console.log(`[useAuth] setState — null session, clearing state`);
        setState({ user: null, employee: null, loading: false });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
