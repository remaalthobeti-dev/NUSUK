import type { Metadata } from "next";
import { getAuditLogs } from "@/lib/data/admin";
import { AuditLogView } from "@/components/audit/audit-log-view";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "سجل النشاط — نسك" };

const PAGE_SIZE = 25;

export default async function ActivityPage() {
  const { logs, total } = await getAuditLogs(1, PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="سجل النشاط والمراجعة"
        description="تتبع جميع الإجراءات التي تمت على النظام مع إمكانية التصدير"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "سجل النشاط" },
        ]}
      />
      <AuditLogView
        initialLogs={logs}
        initialTotal={total}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
