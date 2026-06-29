import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!employee) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">الملف الشخصي</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة معلوماتك الشخصية وكلمة المرور</p>
      </div>
      <ProfileForm employee={employee} />
    </div>
  );
}
