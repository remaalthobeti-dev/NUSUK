"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { approveRequest, rejectRequest } from "@/lib/data/approvals";
import type { UserRole } from "@/types/database";

async function getReviewerId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function approveRequestAction(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  const role = formData.get("role") as UserRole;
  const teamId = (formData.get("teamId") as string) || null;
  const jobTitle = (formData.get("jobTitle") as string) ?? "";

  const reviewerId = await getReviewerId();
  if (!reviewerId) return { error: "غير مصرح" };

  const result = await approveRequest(requestId, reviewerId, { role, teamId, jobTitle });
  if (!result.error) revalidatePath("/dashboard/approvals");
  return result;
}

export async function rejectRequestAction(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  const reason = (formData.get("reason") as string) ?? "";

  const reviewerId = await getReviewerId();
  if (!reviewerId) return { error: "غير مصرح" };

  const result = await rejectRequest(requestId, reviewerId, reason);
  if (!result.error) revalidatePath("/dashboard/approvals");
  return result;
}
