import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileStatusCard } from "@/components/profile/profile-status-card";
import type { Employee, AvailabilityStatus } from "@/types/database";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  let redirectTo: string | null = null;
  let employee: Employee | null = null;
  let currentStatus: AvailabilityStatus = "available";
  let currentNote: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirectTo = "/login";
    } else {
      const { data: empData } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single();

      employee = empData as Employee | null;
      if (!employee) {
        redirectTo = "/login";
      } else {
        const { data: pres } = await supabase
          .from("employee_presence")
          .select("availability_status, notes")
          .eq("employee_id", employee.id)
          .maybeSingle();

        currentStatus = (pres?.availability_status ?? "available") as AvailabilityStatus;
        currentNote = pres?.notes ?? null;
      }
    }
  } catch (err) {
    const digest = (err as { digest?: string }).digest;
    if (
      digest === "DYNAMIC_SERVER_USAGE" ||
      (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT"))
    )
      throw err;
    console.error("[profile/page]", err);
    redirectTo = "/login";
  }

  if (redirectTo) redirect(redirectTo);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الملف الشخصي</h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة معلوماتك الشخصية وحالة التواجد
        </p>
      </div>

      {/* Status card */}
      <ProfileStatusCard currentStatus={currentStatus} currentNote={currentNote} />

      {/* Profile info form */}
      <ProfileForm employee={employee!} />
    </div>
  );
}
