import type { Metadata } from "next";
import { assertAuthenticated } from "@/lib/auth/guards";
import { getTeamsDirectory } from "@/lib/data/teams-directory";
import { TeamsClient } from "@/components/teams/teams-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الفرق — نسك" };

export default async function TeamsPage() {
  await assertAuthenticated();

  const { teams, error } = await getTeamsDirectory();

  return (
    <>
      <PageHeader
        title="الفرق"
        description="نظرة عامة على جميع الفرق وأعضائها ونسبة التوافر"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الفرق" },
        ]}
      />
      {error ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          تعذّر تحميل الفرق — حاول تحديث الصفحة
        </div>
      ) : (
        <TeamsClient teams={teams} />
      )}
    </>
  );
}
