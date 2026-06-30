/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RegistrationRequest, UserRole, Team } from "@/types/database";

export async function getPendingRequests(): Promise<RegistrationRequest[]> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("registration_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as RegistrationRequest[] | null) ?? [];
}

export async function getAllRequests(): Promise<RegistrationRequest[]> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("registration_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as RegistrationRequest[] | null) ?? [];
}

export async function approveRequest(
  requestId: string,
  reviewerId: string,
  opts: { role: UserRole; teamId: string | null; jobTitle: string }
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: req, error: fetchErr } = await (supabase as any)
    .from("registration_requests")
    .select("auth_user_id, full_name, email")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req) return { error: "طلب غير موجود" };

  const { auth_user_id, full_name, email } = req as {
    auth_user_id: string;
    full_name: string;
    email: string;
  };

  const { error: empErr } = await (supabase as any).from("employees").insert({
    user_id: auth_user_id,
    full_name,
    email,
    role: opts.role,
    team_id: opts.teamId,
    job_title: opts.jobTitle || null,
    is_active: true,
  });

  if (empErr) return { error: (empErr as any).message };

  // Confirm the email in auth.users so the user can sign in.
  // signUp() leaves email_confirmed_at = null; approval is the confirmation gate.
  const admin = createAdminClient();
  const { error: confirmErr } = await admin.auth.admin.updateUserById(
    auth_user_id,
    { email_confirm: true }
  );
  if (confirmErr) return { error: confirmErr.message };

  const { error: updateErr } = await (supabase as any)
    .from("registration_requests")
    .update({
      status: "approved",
      approved_role: opts.role,
      approved_team_id: opts.teamId,
      approved_title: opts.jobTitle || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateErr) return { error: (updateErr as any).message };
  return { error: null };
}

export async function rejectRequest(
  requestId: string,
  reviewerId: string,
  reason: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from("registration_requests")
    .update({
      status: "rejected",
      rejection_reason: reason || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  return { error: error ? (error as any).message : null };
}

export async function getTeamsForApprovals(): Promise<Team[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return (data as Team[] | null) ?? [];
}
