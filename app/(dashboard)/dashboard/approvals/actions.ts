"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { approveRequest, rejectRequest } from "@/lib/data/approvals";
import type { UserRole } from "@/types/database";

export async function approveRequestAction(formData: FormData) {
  const { supabase, context, error } = await requireSuperAdmin();
  if (!supabase || !context) return { error };

  const requestId = formData.get("requestId") as string;
  const role = formData.get("role") as UserRole;
  const teamId = (formData.get("teamId") as string) || null;
  const jobTitle = (formData.get("jobTitle") as string) ?? "";

  const result = await approveRequest(requestId, context.employee.id, { role, teamId, jobTitle });
  if (!result.error) revalidatePath("/dashboard/approvals");
  return result;
}

export async function rejectRequestAction(formData: FormData) {
  const { supabase, context, error } = await requireSuperAdmin();
  if (!supabase || !context) return { error };

  const requestId = formData.get("requestId") as string;
  const reason = (formData.get("reason") as string) ?? "";

  const result = await rejectRequest(requestId, context.employee.id, reason);
  if (!result.error) revalidatePath("/dashboard/approvals");
  return result;
}
