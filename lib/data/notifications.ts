"use server";

import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types/database";

export async function getMyNotifications(limit = 100): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!emp) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", emp.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as Notification[] | null) ?? [];
}

export async function getMyUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!emp) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", emp.id)
    .eq("is_read", false);

  return count ?? 0;
}
