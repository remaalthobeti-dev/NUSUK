"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import type { UserRole } from "@/types/database";

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function createTeamAction(form: {
  name: string;
  name_en: string | null;
  description: string | null;
  color: string;
  icon: string;
}): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  const { error: dbErr } = await supabase.from("teams").insert({
    name: form.name,
    name_en: form.name_en,
    description: form.description,
    color: form.color,
    icon: form.icon,
    is_active: true,
  });
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}

export async function updateTeamAction(
  id: string,
  form: {
    name: string;
    name_en: string | null;
    description: string | null;
    color: string;
    icon: string;
  }
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  const { error: dbErr } = await supabase
    .from("teams")
    .update({
      name: form.name,
      name_en: form.name_en,
      description: form.description,
      color: form.color,
      icon: form.icon,
    })
    .eq("id", id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}

export async function setTeamActiveAction(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  const { error: dbErr } = await supabase
    .from("teams")
    .update({ is_active: isActive })
    .eq("id", id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}

export async function setTeamDistributionRoleAction(
  teamId: string,
  role: "distribution" | "corporate" | null
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  if (role === null) {
    const { error: dbErr } = await supabase
      .from("distribution_team_configs")
      .delete()
      .eq("team_id", teamId);
    if (dbErr) return { error: dbErr.message };
  } else {
    const { error: dbErr } = await supabase
      .from("distribution_team_configs")
      .upsert({ team_id: teamId, page_role: role }, { onConflict: "team_id" });
    if (dbErr) return { error: dbErr.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/distribution");
  revalidatePath("/dashboard/corporate");
  return { error: null };
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function createEmployeeAction(form: {
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  team_id: string | null;
}): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  const { error: dbErr } = await supabase.from("employees").insert({
    full_name: form.full_name,
    email: form.email,
    phone: form.phone,
    role: form.role,
    team_id: form.team_id,
    is_active: true,
  });
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}

export async function updateEmployeeAction(
  id: string,
  form: {
    full_name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    team_id: string | null;
    is_active: boolean;
  }
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  const { error: dbErr } = await supabase
    .from("employees")
    .update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      team_id: form.team_id,
      is_active: form.is_active,
    })
    .eq("id", id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}

export async function setEmployeeActiveAction(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error };

  const { error: dbErr } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}
