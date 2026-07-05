"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/guards";

export type AnnouncementTarget =
  | { type: "all" }
  | { type: "team"; teamId: string }
  | { type: "individuals"; employeeIds: string[] };

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  target: AnnouncementTarget;
}

export async function createCircularAction(
  payload: CreateAnnouncementPayload
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireManager();
  if (error) return { error };

  let query = supabase.from("employees").select("id").eq("is_active", true);

  if (payload.target.type === "team") {
    query = query.eq("team_id", payload.target.teamId);
  } else if (payload.target.type === "individuals") {
    if (!payload.target.employeeIds.length) return { error: "اختر موظفاً واحداً على الأقل" };
    query = query.in("id", payload.target.employeeIds);
  }

  const { data: employees, error: empErr } = await query;
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
