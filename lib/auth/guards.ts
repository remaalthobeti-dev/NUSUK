import { forbidden } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

const UNAUTHORIZED = "ليس لديك صلاحية لتنفيذ هذا الإجراء." as const;

// ─── Core ─────────────────────────────────────────────────────────────────────
//
// resolveEmployee is the single auth + role check implementation.
// Every named guard below is a thin wrapper around it.
//
// allowedRoles:
//   null  → any active employee is accepted (authentication only)
//   [...] → employee's role must be one of the listed values

async function resolveEmployee(allowedRoles: UserRole[] | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, user: null, employeeId: null, role: null, error: UNAUTHORIZED };
  }

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  const employee = emp as { id: string; role: UserRole } | null;

  if (!employee) {
    return { supabase: null, user: null, employeeId: null, role: null, error: UNAUTHORIZED };
  }

  if (allowedRoles !== null && !allowedRoles.includes(employee.role)) {
    return { supabase: null, user: null, employeeId: null, role: null, error: UNAUTHORIZED };
  }

  return { supabase, user, employeeId: employee.id, role: employee.role, error: null };
}

// Page variant: calls forbidden() which throws → Next.js renders app/forbidden.tsx (HTTP 403)
async function assertRole(allowedRoles: UserRole[] | null): Promise<void> {
  const result = await resolveEmployee(allowedRoles);
  if (result.error) forbidden();
}

// ─── Action guards ────────────────────────────────────────────────────────────
//
// Use in Server Actions ("use server").
// Always check `result.error` before proceeding — if non-null, return it to the client.
// On success, supabase / user / employeeId / role are all non-null.

/** Any logged-in, active employee. */
export function requireAuthenticated() {
  return resolveEmployee(null);
}

/** track_manager or super_admin. Use for team-level operations. */
export function requireTeamLeader() {
  return resolveEmployee(["track_manager", "super_admin"]);
}

/**
 * track_manager or super_admin.
 * Semantically broader than requireTeamLeader — use when the operation is
 * "management-level" rather than tied to leading a specific team.
 * Both map to the same roles today; they can diverge if new roles are added.
 */
export function requireManager() {
  return resolveEmployee(["track_manager", "super_admin"]);
}

/** super_admin only. Use for system-wide administration. */
export function requireSuperAdmin() {
  return resolveEmployee(["super_admin"]);
}

// ─── Page guards ──────────────────────────────────────────────────────────────
//
// Use in async Server Component page functions (`export default async function Page()`).
// Call with `await` at the top of the page before any data fetching.
// Unauthorized access renders app/forbidden.tsx with HTTP 403 — nothing else runs.

/** Any logged-in, active employee. */
export function assertAuthenticated(): Promise<void> {
  return assertRole(null);
}

/** track_manager or super_admin. */
export function assertTeamLeader(): Promise<void> {
  return assertRole(["track_manager", "super_admin"]);
}

/** track_manager or super_admin (broader management-level access). */
export function assertManager(): Promise<void> {
  return assertRole(["track_manager", "super_admin"]);
}

/** super_admin only. */
export function assertSuperAdmin(): Promise<void> {
  return assertRole(["super_admin"]);
}
