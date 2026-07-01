"use server";

import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";
import type { User } from "@supabase/supabase-js";

/**
 * Reads the authenticated user and their employee record from the server-side
 * Supabase client, which uses HTTP request cookies rather than document.cookie.
 *
 * Called by useAuth on mount to resolve the initial auth state without relying
 * on the browser client's chunk-based cookie parsing, which can transiently
 * fail when stale cookie chunks from a previous shorter session are present.
 */
export async function getAuthStateAction(): Promise<{
  user: User | null;
  employee: Employee | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user: null, employee: null };

    const { data: employee } = await supabase
      .from("employees")
      .select("*, team:teams(*)")
      .eq("user_id", user.id)
      .single();

    return { user, employee: (employee as Employee | null) ?? null };
  } catch {
    return { user: null, employee: null };
  }
}
