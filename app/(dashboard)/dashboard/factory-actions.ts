"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateFactoryPressureAction(
  level: "low" | "medium" | "high"
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase.from("factory_pressure").insert({
    level,
    updated_by: emp?.id ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}
