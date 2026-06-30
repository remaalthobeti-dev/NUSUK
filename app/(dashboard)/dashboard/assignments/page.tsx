import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AssignmentsClient } from "@/components/assignments/assignments-client";
import { getAvailableTasks, getRunningTasks } from "@/lib/data/assignments";
import { assertAuthenticated } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "إسناد الأعمال — نسك" };

export default async function AssignmentsPage() {
  await assertAuthenticated();

  const [available, running] = await Promise.all([
    getAvailableTasks(),
    getRunningTasks(),
  ]);

  return (
    <>
      <PageHeader
        title="إسناد الأعمال"
        description="أعمال فريقك المتاحة والجارية"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "إسناد الأعمال" },
        ]}
      />
      <AssignmentsClient
        availableTasks={available.tasks}
        runningTasks={running.tasks}
      />
    </>
  );
}
