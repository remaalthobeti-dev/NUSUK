"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { approveRequest, rejectRequest } from "@/lib/data/approvals";
import type { UserRole } from "@/types/database";

export async function approveRequestAction(formData: FormData) {
  const { supabase, employeeId, error } = await requireSuperAdmin();
  if (!supabase || !employeeId) return { error };

  const requestId = formData.get("requestId") as string;
  const role = formData.get("role") as UserRole;
  const teamId = (formData.get("teamId") as string) || null;
  const jobTitle = (formData.get("jobTitle") as string) ?? "";

  const result = await approveRequest(requestId, employeeId, { role, teamId, jobTitle });
  if (!result.error) revalidatePath("/dashboard/approvals");
  return result;
}

export async function rejectRequestAction(formData: FormData) {
  const { supabase, employeeId, error } = await requireSuperAdmin();
  if (!supabase || !employeeId) return { error };

  const requestId = formData.get("requestId") as string;
  const reason = (formData.get("reason") as string) ?? "";

  const result = await rejectRequest(requestId, employeeId, reason);
  if (!result.error) revalidatePath("/dashboard/approvals");
  return result;
}
