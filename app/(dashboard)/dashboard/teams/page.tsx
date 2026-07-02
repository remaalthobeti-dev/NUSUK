import type { Metadata } from "next";
import { Suspense } from "react";
import { assertAuthenticated } from "@/lib/auth/guards";
import { getTeamsManagement } from "@/lib/data/teams-management";
import { TeamsManagementClient, TeamsManagementSkeleton } from "@/components/teams/teams-management-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "إدارة الفرق — نسك" };

export default async function TeamsPage() {
  await assertAuthenticated();

  const { teams, isSuperAdmin, error } = await getTeamsManagement();

  const activeCount = teams.filter((t) => t.is_active).length;

  return (
    <>
      <PageHeader
        title="إدارة الفرق"
        description={`${activeCount} فريق نشط — نظرة شاملة على الفرق وإحصاءاتها`}
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الفرق" },
        ]}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="font-medium text-destructive">تعذّر تحميل الفرق</p>
          <p className="text-sm text-muted-foreground">حاول تحديث الصفحة</p>
        </div>
      ) : (
        <Suspense fallback={<TeamsManagementSkeleton />}>
          <TeamsManagementClient teams={teams} isSuperAdmin={isSuperAdmin} />
        </Suspense>
      )}
    </>
  );
}
