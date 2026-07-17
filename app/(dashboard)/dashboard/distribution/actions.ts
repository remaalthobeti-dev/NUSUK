"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated } from "@/lib/auth/guards";
import type { DistributionRequestType } from "@/types/distribution";

const PATH = "/dashboard/distribution";

// ── Create new requests (distribution team sends to corporate) ─────────────

export async function createDistributionRequests(
  companyIds: string[],
  requestType: DistributionRequestType,
  center: string
): Promise<{ error: string | null; count?: number }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };
  if (!companyIds.length) return { error: "يجب تحديد شركة واحدة على الأقل" };

  const { data: companies, error: fetchErr } = await supabase
    .from("distribution_companies")
    .select("id, name, type")
    .in("id", companyIds)
    .eq("is_active", true);

  if (fetchErr) return { error: fetchErr.message };
  if (!companies?.length) return { error: "الشركات المحددة غير موجودة" };

  const now = new Date().toISOString();
  const inserts = companies.map((c) => ({
    company_id: c.id,
    company_name: c.name,
    company_type: c.type,
    request_type: requestType,
    status: "new",
    created_by: context.employee.id,
    created_by_name: context.employee.full_name,
    created_at: now,
    updated_at: now,
    center,
  }));

  const { error: insertErr } = await supabase
    .from("distribution_requests")
    .insert(inserts);

  if (insertErr) return { error: insertErr.message };

  revalidatePath(PATH);
  return { error: null, count: inserts.length };
}

// ── Update request to received ─────────────────────────────────────────────

export async function markRequestReceived(
  requestIds: string[]
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("distribution_requests")
    .update({
      status: "received",
      processed_by: context.employee.id,
      processed_by_name: context.employee.full_name,
      processed_at: now,
      updated_at: now,
    })
    .in("id", requestIds)
    .eq("status", "new");

  if (updateErr) return { error: updateErr.message };

  revalidatePath(PATH);
  return { error: null };
}

// ── Update request to delivered (with delegate info) ───────────────────────

export async function markRequestDelivered(
  requestIds: string[],
  delegateName: string,
  delegatePhone: string
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("distribution_requests")
    .update({
      status: "delivered",
      processed_by: context.employee.id,
      processed_by_name: context.employee.full_name,
      processed_at: now,
      updated_at: now,
      delegate_name: delegateName.trim(),
      delegate_phone: delegatePhone.trim(),
    })
    .in("id", requestIds);

  if (updateErr) return { error: updateErr.message };

  revalidatePath(PATH);
  return { error: null };
}

// ── Mark alert requests as reported ────────────────────────────────────────

export async function markRequestReported(
  requestIds: string[]
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("distribution_requests")
    .update({
      status: "reported",
      processed_by: context.employee.id,
      processed_by_name: context.employee.full_name,
      processed_at: now,
      updated_at: now,
    })
    .in("id", requestIds)
    .eq("status", "new");

  if (updateErr) return { error: updateErr.message };

  revalidatePath(PATH);
  return { error: null };
}
