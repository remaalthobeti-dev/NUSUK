import type { Metadata } from "next";
import { assertManager } from "@/lib/auth/guards";
import { getEmployeesDirectory } from "@/lib/data/employees-directory";
import { EmployeesClient } from "@/components/employees/employees-client";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الموظفون — نسك" };

export default async function EmployeesPage() {
  await assertManager();

  const { employees, isSuperAdmin, error } = await getEmployeesDirectory();

  return (
    <>
      <PageHeader
        title="الموظفون"
        description={
          isSuperAdmin
            ? "دليل جميع الموظفين في المنظمة وحالاتهم الحالية"
            : "موظفو فريقك وحالاتهم الحالية"
        }
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الموظفون" },
        ]}
      />
      {error ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          تعذّر تحميل الموظفين — حاول تحديث الصفحة
        </div>
      ) : (
        <EmployeesClient employees={employees} isSuperAdmin={isSuperAdmin} />
      )}
    </>
  );
}
