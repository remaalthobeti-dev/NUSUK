import { forbidden } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UNAUTHORIZED = "ليس لديك صلاحية لتنفيذ هذا الإجراء." as const;

/**
 * For server actions — verifies the caller is a super_admin.
 * Returns the supabase client, user, and employee ID on success.
 * Returns { error } without throwing so actions can return it to the client.
 */
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, user: null, employeeId: null, error: UNAUTHORIZED };
  }

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  const employee = emp as { id: string; role: string } | null;

  if (employee?.role !== "super_admin") {
    return { supabase: null, user: null, employeeId: null, error: UNAUTHORIZED };
  }

  return { supabase, user, employeeId: employee.id, error: null };
}

/**
 * For page server components — calls forbidden() if the caller is not a super_admin.
 * forbidden() throws an internal Next.js error that renders app/forbidden.tsx with HTTP 403.
 */
export async function assertSuperAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) forbidden();

  const { data: emp } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if ((emp as { role: string } | null)?.role !== "super_admin") forbidden();
}
