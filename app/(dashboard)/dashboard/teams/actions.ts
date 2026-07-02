"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin, requireAuthenticated } from "@/lib/auth/guards";

export interface TeamPayload {
  name: string;
  name_en: string | null;
  description: string | null;
  color: string;
  icon: string | null;
}

export async function createTeamAction(
  payload: TeamPayload
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireSuperAdmin();
  if (error) return { error };

  const now = new Date().toISOString();

  const { data: team, error: insertErr } = await supabase
    .from("teams")
    .insert({
      name: payload.name.trim(),
      name_en: payload.name_en?.trim() || null,
      description: payload.description?.trim() || null,
      color: payload.color,
      icon: payload.icon || null,
      is_active: true,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertErr || !team) return { error: insertErr?.message ?? "فشل إنشاء الفريق" };

  await supabase.from("activity_logs").insert({
    action: "team_created",
    actor_id: context.employee.id,
    entity_type: "team",
    entity_id: team.id,
    new_values: { name: payload.name, color: payload.color },
  });

  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateTeamAction(
  teamId: string,
  payload: TeamPayload
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireSuperAdmin();
  if (error) return { error };

  const { error: updateErr } = await supabase
    .from("teams")
    .update({
      name: payload.name.trim(),
      name_en: payload.name_en?.trim() || null,
      description: payload.description?.trim() || null,
      color: payload.color,
      icon: payload.icon || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("activity_logs").insert({
    action: "team_updated",
    actor_id: context.employee.id,
    entity_type: "team",
    entity_id: teamId,
    new_values: { name: payload.name, color: payload.color },
  });

  revalidatePath("/dashboard/teams");
  revalidatePath(`/dashboard/${teamId}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function archiveTeamAction(
  teamId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireSuperAdmin();
  if (error) return { error };

  const { error: updateErr } = await supabase
    .from("teams")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", teamId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("activity_logs").insert({
    action: "team_archived",
    actor_id: context.employee.id,
    entity_type: "team",
    entity_id: teamId,
  });

  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function restoreTeamAction(
  teamId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireSuperAdmin();
  if (error) return { error };

  const { error: updateErr } = await supabase
    .from("teams")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", teamId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("activity_logs").insert({
    action: "team_restored",
    actor_id: context.employee.id,
    entity_type: "team",
    entity_id: teamId,
  });

  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteTeamAction(
  teamId: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireSuperAdmin();
  if (error) return { error };

  // Guard: cannot delete if team has active employees
  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("is_active", true);

  if ((count ?? 0) > 0)
    return { error: "لا يمكن حذف فريق يحتوي على موظفين نشطين. أرشف الفريق أولاً أو انقل الموظفين." };

  const { error: deleteErr } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (deleteErr) return { error: deleteErr.message };

  await supabase.from("activity_logs").insert({
    action: "team_deleted",
    actor_id: context.employee.id,
    entity_type: "team",
    entity_id: teamId,
  });

  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard");
  return { error: null };
}
