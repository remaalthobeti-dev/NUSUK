"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticated } from "@/lib/auth/guards";
import type { AvailabilityStatus } from "@/types/database";

export async function updateMyStatusAction(
  status: AvailabilityStatus
): Promise<{ error: string | null }> {
  const { supabase, context, error } = await requireAuthenticated();
  if (error) return { error };

  const { error: dbErr } = await supabase
    .from("employee_presence")
    .upsert(
      {
        employee_id: context.employee.id,
        availability_status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );

  if (dbErr) return { error: dbErr.message };
  revalidatePath("/dashboard");
  return { error: null };
}
