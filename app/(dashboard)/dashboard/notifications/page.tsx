import type { Metadata } from "next";
import { getAllNotifications } from "@/lib/data/admin";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "الإشعارات — نسك" };

export default async function NotificationsPage() {
  const notifications = await getAllNotifications();

  return (
    <>
      <PageHeader
        title="مركز الإشعارات"
        description="جميع الإشعارات والتنبيهات الخاصة بالنظام"
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الإشعارات" },
        ]}
      />
      <NotificationCenter initialNotifications={notifications} />
    </>
  );
}
