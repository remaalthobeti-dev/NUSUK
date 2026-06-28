import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  } catch (err) {
    // createClient throws if env vars are missing; treat as unauthenticated
    if (err instanceof Error && err.message.startsWith("Missing Supabase")) {
      redirect("/login?error=config");
    }
    // Re-throw redirect signals from next/navigation
    throw err;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
