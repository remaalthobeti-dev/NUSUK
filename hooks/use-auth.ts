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

    async function fetchEmployee(userId: string) {
      const { data } = await supabase
        .from("employees")
        .select("*, team:teams(*)")
        .eq("user_id", userId)
        .single();
      return data as Employee | null;
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const employee = await fetchEmployee(user.id);
        setState({ user, employee, loading: false });
      } else {
        setState({ user: null, employee: null, loading: false });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const employee = await fetchEmployee(session.user.id);
        setState({ user: session.user, employee, loading: false });
      } else {
        setState({ user: null, employee: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
