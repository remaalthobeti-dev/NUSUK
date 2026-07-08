import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AuthProvider } from "@/components/demo/demo-auth-provider";

export default function ScreenshotLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
