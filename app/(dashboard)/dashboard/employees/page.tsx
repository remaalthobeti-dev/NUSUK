import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { assertManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "الموظفون — نسك" };

export default async function EmployeesPage() {
  await assertManager();

  return (
    <>
      <PageHeader
        title="الموظفون"
        description="إدارة الموظفين وبيانات الفريق"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الموظفون" },
        ]}
      />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-sm">
          سيتوفر هذا القسم في الإصدار القادم
        </p>
      </div>
    </>
  );
}
