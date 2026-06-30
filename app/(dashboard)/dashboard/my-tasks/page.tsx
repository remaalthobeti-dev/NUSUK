import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { assertAuthenticated } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "مهامي — نسك" };

export default async function MyTasksPage() {
  await assertAuthenticated();

  return (
    <>
      <PageHeader
        title="مهامي"
        description="المهام المسندة إليك ومتابعة تقدمها"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "مهامي" },
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
