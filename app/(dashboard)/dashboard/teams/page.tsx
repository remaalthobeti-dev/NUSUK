import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { assertAuthenticated } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "الفرق — نسك" };

export default async function TeamsPage() {
  await assertAuthenticated();

  return (
    <>
      <PageHeader
        title="الفرق"
        description="نظرة عامة على جميع الفرق وأعضائها"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الفرق" },
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
