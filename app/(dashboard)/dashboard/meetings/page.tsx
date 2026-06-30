import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { assertAuthenticated } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "الاجتماعات — نسك" };

export default async function MeetingsPage() {
  await assertAuthenticated();

  return (
    <>
      <PageHeader
        title="الاجتماعات"
        description="جدول الاجتماعات وإدارتها"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الاجتماعات" },
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
