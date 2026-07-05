"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/guards";

export interface CreateCircularPayload {
  title: string;
  body: string;
}

export async function createCircularAction(
  payload: CreateCircularPayload
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireManager();
  if (error) return { error };

  // Fetch all active employee IDs
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id")
    .eq("is_active", true);

  if (empErr || !employees) return { error: empErr?.message ?? "فشل جلب الموظفين" };


  const now = new Date().toISOString();
  const notifications = employees.map((emp) => ({
    recipient_id: emp.id,
    sender_id: context.employee.id,
    title: payload.title.trim(),
    body: payload.body.trim(),
    type: "system" as const,
    data: { is_circular: true },
    is_read: false,
    created_at: now,
  }));

  const { error: insertErr } = await supabase.from("notifications").insert(notifications);
  if (insertErr) return { error: insertErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return { error: null };
}
