import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MyTasksClient } from "@/components/my-tasks/my-tasks-client";
import { getMyTasks } from "@/lib/data/my-tasks";

export const metadata: Metadata = { title: "مهامي — نسك" };

export default async function MyTasksPage() {
  const { tasks, employeeId, error } = await getMyTasks();

  return (
    <>
      <PageHeader
        title="مهامي"
        description="المهام المسندة إليك وتتبع حالتها"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "مهامي" },
        ]}
      />
      {error ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          تعذّر تحميل المهام — حاول تحديث الصفحة
        </div>
      ) : (
        <MyTasksClient initialTasks={tasks} employeeId={employeeId} />
      )}
    </>
  );
}
