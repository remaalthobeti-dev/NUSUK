import { forbidden } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

// ─── Permissions ──────────────────────────────────────────────────────────────

export type Permission =
  | "manage_employees"
  | "manage_teams"
  | "approve_users"
  | "manage_roles"
  | "manage_statuses"
  | "assign_tasks"
  | "view_analytics"
  | "view_activity"
  | "update_own_status"
  | "view_team";

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: [
    "manage_employees",
    "manage_teams",
    "approve_users",
    "manage_roles",
    "manage_statuses",
    "assign_tasks",
    "view_analytics",
    "view_activity",
    "update_own_status",
    "view_team",
  ],
  track_manager: [
    "assign_tasks",
    "view_analytics",
    "view_activity",
    "update_own_status",
    "view_team",
  ],
  team_member: [
    "update_own_status",
    "view_team",
  ],
};

// ─── Context ──────────────────────────────────────────────────────────────────

export interface EmployeeContext {
  user: User;
  employee: {
    id: string;
    role: UserRole;
    full_name: string;
    team_id: string | null;
  };
  /** Shorthand for employee.role */
  role: UserRole;
  permissions: readonly Permission[];
}

// ─── Core ─────────────────────────────────────────────────────────────────────

const UNAUTHORIZED = "ليس لديك صلاحية لتنفيذ هذا الإجراء." as const;

type GuardSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  context: EmployeeContext;
  error: null;
};

type GuardFailure = {
  supabase: null;
  context: null;
  error: typeof UNAUTHORIZED;
};

type GuardResult = GuardSuccess | GuardFailure;

const FAIL: GuardFailure = { supabase: null, context: null, error: UNAUTHORIZED };

/**
 * Resolves the authenticated, active employee and checks role membership.
 * allowedRoles: null = any active employee; [...] = role must be in the list.
 */
async function resolveEmployee(allowedRoles: UserRole[] | null): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return FAIL;

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role, full_name, team_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  const employee = emp as EmployeeContext["employee"] | null;
  if (!employee) return FAIL;

  if (allowedRoles !== null && !allowedRoles.includes(employee.role)) return FAIL;

  const context: EmployeeContext = {
    user,
    employee,
    role: employee.role,
    permissions: ROLE_PERMISSIONS[employee.role],
  };

  return { supabase, context, error: null };
}

/** Page variant — calls forbidden() (→ HTTP 403 / app/forbidden.tsx) on failure. */
async function assertRole(allowedRoles: UserRole[] | null): Promise<void> {
  const result = await resolveEmployee(allowedRoles);
  if (result.error) forbidden();
}

// ─── Action guards ────────────────────────────────────────────────────────────
//
// Use inside "use server" files.
// Check `result.error` before proceeding; on success context and supabase are non-null.
//
// Example:
//   const { supabase, context, error } = await requireSuperAdmin();
//   if (error) return { error };
//   await supabase.from("teams").insert({ ... });

/** Any logged-in, active employee. */
export function requireAuthenticated(): Promise<GuardResult> {
  return resolveEmployee(null);
}

/** track_manager or super_admin — for team-level operations. */
export function requireTeamLeader(): Promise<GuardResult> {
  return resolveEmployee(["track_manager", "super_admin"]);
}

/**
 * track_manager or super_admin — broader management-level access.
 * Semantically distinct from requireTeamLeader; both resolve to the same roles
 * today and can diverge if new roles are introduced.
 */
export function requireManager(): Promise<GuardResult> {
  return resolveEmployee(["track_manager", "super_admin"]);
}

/** super_admin only — for system-wide administration. */
export function requireSuperAdmin(): Promise<GuardResult> {
  return resolveEmployee(["super_admin"]);
}

/**
 * Requires the caller to hold a specific permission.
 * Permission → role mapping is defined in ROLE_PERMISSIONS above.
 *
 * Example:
 *   const { supabase, context, error } = await requirePermission("manage_teams");
 *   if (error) return { error };
 */
export async function requirePermission(permission: Permission): Promise<GuardResult> {
  const result = await resolveEmployee(null);
  if (result.error) return result;
  if (!result.context.permissions.includes(permission)) return FAIL;
  return result;
}

// ─── Page guards ──────────────────────────────────────────────────────────────
//
// Use at the top of async Server Component pages with `await`.
// Unauthorized access renders app/forbidden.tsx — the rest of the page never runs.
//
// Example:
//   export default async function Page() {
//     await assertSuperAdmin();
//     // ... rest of page

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

/**
 * Requires the caller to hold a specific permission.
 *
 * Example:
 *   await assertPermission("manage_employees");
 */
export async function assertPermission(permission: Permission): Promise<void> {
  const result = await resolveEmployee(null);
  if (result.error) forbidden();
  if (!result.context.permissions.includes(permission)) forbidden();
}
