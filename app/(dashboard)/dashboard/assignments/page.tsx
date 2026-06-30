import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { assertAuthenticated } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "إسناد الأعمال — نسك" };

export default async function AssignmentsPage() {
  await assertAuthenticated();

  return (
    <>
      <PageHeader
        title="إسناد الأعمال"
        description="إسناد المهام وإدارة العمل بين الفريق"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "إسناد الأعمال" },
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
