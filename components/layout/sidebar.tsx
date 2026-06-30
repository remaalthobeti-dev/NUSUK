"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  ListTodo,
  LayoutDashboard,
  Users,
  UserCheck,
  Bell,
  CalendarDays,
  CircleUser,
  Settings,
  ChevronLeft,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { employee } = useAuth();

  const role = employee?.role;
  const isSuperAdmin = role === "super_admin";
  const canManage = role === "super_admin" || role === "track_manager";

  const navItems: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "الرئيسية" },
    { href: "/dashboard/assignments", icon: ClipboardList, label: "إسناد الأعمال" },
    { href: "/dashboard/my-tasks", icon: ListTodo, label: "مهامي" },
    { href: "/dashboard/operations", icon: LayoutDashboard, label: "مركز العمليات" },
    { href: "/dashboard/teams", icon: Users, label: "الفرق" },
    ...(canManage
      ? [{ href: "/dashboard/employees", icon: UserCheck, label: "الموظفون" }]
      : []),
    { href: "/dashboard/notifications", icon: Bell, label: "الإشعارات" },
    { href: "/dashboard/meetings", icon: CalendarDays, label: "الاجتماعات" },
    { href: "/dashboard/profile", icon: CircleUser, label: "الملف الشخصي" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 end-0 z-40 h-screen bg-card border-s flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed
            ? "w-[var(--sidebar-collapsed-width)]"
            : "w-[var(--sidebar-width)]",
          "hidden lg:flex",
          isMobileOpen && "!flex"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "h-[var(--navbar-height)] flex items-center border-b px-4 shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg nusuk-gradient flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground leading-tight text-sm">
                  نسك
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  إدارة البطاقات
                </p>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg nusuk-gradient flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}

          {/* Mobile close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Desktop collapse toggle */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hidden lg:flex"
              aria-label="طي القائمة الجانبية"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <TooltipProvider delayDuration={0}>
            <nav className="px-3 space-y-1">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  }
                  onClick={onMobileClose}
                />
              ))}
            </nav>
          </TooltipProvider>
        </ScrollArea>

        {/* Bottom: Settings (super_admin only) */}
        {isSuperAdmin && (
          <div className="p-3 border-t">
            <TooltipProvider delayDuration={0}>
              <SidebarItem
                item={{
                  href: "/dashboard/settings",
                  icon: Settings,
                  label: "الإعدادات",
                }}
                isCollapsed={isCollapsed}
                isActive={pathname.startsWith("/dashboard/settings")}
                onClick={onMobileClose}
              />
            </TooltipProvider>
          </div>
        )}

        {/* Expand button when collapsed (desktop) */}
        {isCollapsed && (
          <div className="p-3 border-t hidden lg:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="w-full"
              aria-label="توسيع القائمة الجانبية"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

function SidebarItem({
  item,
  isCollapsed,
  isActive,
  onClick,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isCollapsed && "justify-center px-2",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
