import type { Metadata } from "next";
import { getCorporatePageData } from "@/lib/data/corporate";
import { CorporateClient } from "@/components/corporate/corporate-client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldX } from "lucide-react";

export const metadata: Metadata = { title: "علاقات الشركات — نسك" };

export default async function CorporatePage() {
  const data = await getCorporatePageData();

  if (data.error === "ليس لديك صلاحية لتنفيذ هذا الإجراء." || data.pageRole === "distribution") {
    return (
      <div className="max-w-xl mx-auto pt-16">
        <EmptyState
          icon={<ShieldX />}
          title="غير مصرح"
          description="هذه الصفحة مخصصة لفريق علاقات الشركات فقط."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="علاقات الشركات"
        description="متابعة ومعالجة طلبات التوزيع الواردة من فريق التوزيع"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "علاقات الشركات" },
        ]}
      />
      <CorporateClient data={data} />
    </div>
  );
}
