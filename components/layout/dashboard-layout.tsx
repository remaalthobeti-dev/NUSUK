"use client";

import { useSidebar } from "@/hooks/use-sidebar";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggle, isMobileOpen, toggleMobile, closeMobile } =
    useSidebar();

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={closeMobile}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed
            ? "lg:ms-[var(--sidebar-collapsed-width)]"
            : "lg:ms-[var(--sidebar-width)]"
        )}
      >
        {/* Navbar */}
        <Navbar
          onMobileMenuToggle={toggleMobile}
          sidebarCollapsed={isCollapsed}
        />

        {/* Page Content */}
        <main className="pt-[var(--navbar-height)] min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
