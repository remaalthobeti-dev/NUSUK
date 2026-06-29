import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Employee } from "@/types/database";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  let redirectTo: string | null = null;
  let employee: Employee | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirectTo = "/login";
    } else {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single();
      employee = data as Employee | null;
      if (!employee) redirectTo = "/login";
    }
  } catch (err) {
    const digest = (err as { digest?: string }).digest;
    if (digest === "DYNAMIC_SERVER_USAGE" || (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT"))) throw err;
    console.error("[profile/page]", err);
    redirectTo = "/login";
  }

  if (redirectTo) redirect(redirectTo);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">الملف الشخصي</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة معلوماتك الشخصية وكلمة المرور</p>
      </div>
      <ProfileForm employee={employee!} />
    </div>
  );
}
