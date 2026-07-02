import type { Metadata } from "next";
import { requireAuthenticated } from "@/lib/auth/guards";
import { getMyNotifications } from "@/lib/data/notifications";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الإشعارات — نسك" };

export default async function NotificationsPage() {
  const { context, error } = await requireAuthenticated();
  if (error) return null;

  const notifications = await getMyNotifications();

  return (
    <>
      <PageHeader
        title="مركز الإشعارات"
        description="جميع الإشعارات والتنبيهات الخاصة بك"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الإشعارات" },
        ]}
      />
      <NotificationCenter
        initialNotifications={notifications}
        employeeId={context.employee.id}
      />
    </>
  );
}
