import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileStatusCard } from "@/components/profile/profile-status-card";
import { PageHeader } from "@/components/shared/page-header";
import type { Employee, AvailabilityStatus } from "@/types/database";
import type { DistributionPageRole } from "@/types/distribution";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  let redirectTo: string | null = null;
  let employee: Employee | null = null;
  let currentStatus: AvailabilityStatus = "available";
  let currentNote: string | null = null;
  let distributionRole: DistributionPageRole | null = null;

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
        const [presResult, distResult] = await Promise.all([
          supabase
            .from("employee_presence")
            .select("availability_status, notes")
            .eq("employee_id", employee.id)
            .maybeSingle(),
          employee.team_id
            ? supabase
                .from("distribution_team_configs")
                .select("page_role")
                .eq("team_id", employee.team_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        currentStatus = (presResult.data?.availability_status ?? "available") as AvailabilityStatus;
        currentNote = presResult.data?.notes ?? null;

        if (employee.role === "super_admin" || employee.role === "track_manager") {
          distributionRole = "admin";
        } else if (distResult.data?.page_role) {
          distributionRole = distResult.data.page_role as DistributionPageRole;
        }
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
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="الملف الشخصي"
        description="إدارة معلوماتك الشخصية وكلمة المرور وحالة التواجد"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الملف الشخصي" },
        ]}
      />
      <ProfileStatusCard currentStatus={currentStatus} currentNote={currentNote} />
      <ProfileForm employee={employee!} distributionRole={distributionRole} />
    </div>
  );
}
