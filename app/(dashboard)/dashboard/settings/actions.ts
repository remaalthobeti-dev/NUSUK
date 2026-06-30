"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "غير مصرح" as const };

  const { data: emp } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if ((emp as { role: string } | null)?.role !== "super_admin")
    return { supabase: null, error: "غير مصرح" as const };

  return { supabase, error: null };
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function createTeamAction(form: {
  name: string;
  name_en: string | null;
  description: string | null;
  color: string;
  icon: string;
}): Promise<{ error: string | null }> {
  const { supabase, error } = await requireSuperAdmin();
  if (!supabase) return { error: error ?? "غير مصرح" };

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
  if (!supabase) return { error: error ?? "غير مصرح" };

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
  if (!supabase) return { error: error ?? "غير مصرح" };

  const { error: dbErr } = await supabase
    .from("teams")
    .update({ is_active: isActive })
    .eq("id", id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
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
  if (!supabase) return { error: error ?? "غير مصرح" };

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
  if (!supabase) return { error: error ?? "غير مصرح" };

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
  if (!supabase) return { error: error ?? "غير مصرح" };

  const { error: dbErr } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", id);
  if (dbErr) return { error: dbErr.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}
