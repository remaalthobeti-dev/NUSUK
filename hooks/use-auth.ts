"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthStateAction } from "@/lib/auth/actions";
import type { User } from "@supabase/supabase-js";
import type { Employee } from "@/types/database";

interface AuthState {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
}

// Fetches the employee record using the JWT from the auth-state-change callback
// rather than letting _getAccessToken() re-read document.cookie. This prevents
// the anon-key fallback that occurs when cookie chunks are transiently inconsistent.
async function fetchEmployeeWithToken(
  userId: string,
  accessToken: string
): Promise<Employee | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) return null;
  const res = await fetch(
    `${base}/rest/v1/employees?select=*,team:teams(*)&user_id=eq.${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anon,
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return ((rows as Employee[])[0]) ?? null;
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

    // Resolve the initial auth state via a server action. The server action reads
    // HTTP request cookies (set by the middleware, always consistent) rather than
    // document.cookie, so it is immune to the chunk-race that can leave the browser
    // client with a null session at startup. This is the sole handler for the
    // INITIAL_SESSION case.
    getAuthStateAction().then(({ user, employee }) => {
      if (!cancelled) setState({ user, employee, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      // INITIAL_SESSION is handled by getAuthStateAction above.
      if (event === "INITIAL_SESSION") return;

      if (session?.user) {
        // Use the access token supplied by the auth event directly — this avoids
        // _getAccessToken() re-reading cookies for each PostgREST request.
        const employee = await fetchEmployeeWithToken(
          session.user.id,
          session.access_token
        );
        if (!cancelled) setState({ user: session.user, employee, loading: false });
      } else {
        if (!cancelled) setState({ user: null, employee: null, loading: false });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
