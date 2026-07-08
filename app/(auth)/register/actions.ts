"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createRegistrationRequestAction(params: {
  authUserId: string;
  fullName: string;
  email: string;
}): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("registration_requests").insert({
      auth_user_id: params.authUserId,
      full_name: params.fullName,
      email: params.email,
      status: "pending",
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: (err as Error).message ?? "حدث خطأ غير متوقع" };
  }
}
