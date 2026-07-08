import type { Metadata } from "next";
import { getDistributionPageData } from "@/lib/data/distribution";
import { DistributionClient } from "@/components/distribution/distribution-client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldX } from "lucide-react";

export const metadata: Metadata = { title: "توزيع بطاقة نسك — نسك" };

export default async function DistributionPage() {
  const data = await getDistributionPageData();

  if (data.error === "ليس لديك صلاحية لتنفيذ هذا الإجراء.") {
    return (
      <div className="max-w-xl mx-auto pt-16">
        <EmptyState
          icon={<ShieldX />}
          title="غير مصرح"
          description="ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع مسؤول النظام."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="توزيع بطاقة نسك"
        description="تنسيق الطلبات بين فريق التوزيع وفريق علاقات الشركات"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "توزيع بطاقة نسك" },
        ]}
      />
      <DistributionClient data={data} />
    </div>
  );
}
