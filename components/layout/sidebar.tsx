"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  ClipboardList,
  ListTodo,
  LayoutDashboard,
  CalendarDays,
  CircleUser,
  Settings,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Building2,
  X,
  BarChart2,
  Boxes,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const BASE_NAV: NavItem[] = [
  { href: "/dashboard",             icon: Home,          label: "الرئيسية" },
  { href: "/dashboard/operations",  icon: LayoutDashboard, label: "مركز العمليات" },
  { href: "/dashboard/assignments", icon: ClipboardList, label: "إسناد الأعمال" },
  { href: "/dashboard/my-tasks",    icon: ListTodo,      label: "مهامي" },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard/meetings", icon: CalendarDays, label: "الاجتماعات" },
  { href: "/dashboard/profile",  icon: CircleUser,   label: "الملف الشخصي" },
];

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
  const { employee, loading } = useAuth();
  const [distRole, setDistRole] = useState<"distribution" | "corporate" | null>(null);
  const [isFactory, setIsFactory] = useState(false);

  useEffect(() => {
    if (!employee?.team_id) { setDistRole(null); setIsFactory(false); return; }
    const supabase = createClient();
    Promise.all([
      supabase.from("distribution_team_configs").select("page_role").eq("team_id", employee.team_id).maybeSingle(),
      supabase.from("factory_team_configs").select("team_id").eq("team_id", employee.team_id).maybeSingle(),
    ]).then(([distRes, factoryRes]) => {
      setDistRole((distRes.data?.page_role as "distribution" | "corporate") ?? null);
      setIsFactory(!!factoryRes.data);
    });
  }, [employee?.team_id]);

  const isSuperAdmin = !loading && employee?.role === "super_admin";
  const isAdmin =
    !loading &&
    (employee?.role === "super_admin" || employee?.role === "track_manager");
  const canManage = isAdmin;

  const showDistribution = isAdmin || distRole === "distribution";
  const showCorporate    = isAdmin || distRole === "corporate";

  function itemProps(item: NavItem) {
    return {
      item,
      isCollapsed,
      isActive:
        item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href),
      onClick: onMobileClose,
    };
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar shell — always dark brand green */}
      <aside
        className={cn(
          "fixed top-0 start-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed
            ? "w-[var(--sidebar-collapsed-width)]"
            : "w-[var(--sidebar-width)]",
          "hidden lg:flex",
          isMobileOpen && "!flex"
        )}
        style={{ background: "hsl(var(--n-dark))" }}
      >
        {/* ── Logo area ── */}
        <div
          className={cn(
            "h-[var(--navbar-height)] flex items-center px-4 shrink-0 border-b",
            isCollapsed ? "justify-center" : "justify-between"
          )}
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          {/* Logo link */}
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              {/* Gold mosque icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--n-gold) / 0.15)" }}
              >
                <Building2
                  className="h-4 w-4"
                  style={{ color: "hsl(var(--n-gold))" }}
                />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate" style={{ color: "hsl(var(--n-ivory))" }}>
                  بطاقات نسك
                </p>
                <p className="text-[10px] leading-tight" style={{ color: "rgba(250,250,247,0.45)" }}>
                  إدارة البطاقات
                </p>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/dashboard">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--n-gold) / 0.15)" }}
              >
                <Building2 className="h-4 w-4" style={{ color: "hsl(var(--n-gold))" }} />
              </div>
            </Link>
          )}

          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(250,250,247,0.6)" }}
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop collapse toggle */}
          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="hidden lg:flex p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "rgba(250,250,247,0.45)" }}
              aria-label="طي القائمة الجانبية"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <ScrollArea className="flex-1 py-3">
          <TooltipProvider delayDuration={0}>
            <nav className="px-3 space-y-0.5">
              {/* Section label */}
              {!isCollapsed && (
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest px-3 pb-2 pt-1"
                  style={{ color: "rgba(250,250,247,0.30)" }}
                >
                  القائمة الرئيسية
                </p>
              )}

              {BASE_NAV
                .filter((item) => !isFactory || item.href === "/dashboard")
                .map((item) => (
                  <SidebarItem key={item.href} {...itemProps(item)} />
                ))}

              {!isFactory && canManage && (
                <SidebarItem
                  {...itemProps({
                    href: "/dashboard/analytics",
                    icon: BarChart2,
                    label: "التقارير",
                  })}
                />
              )}

              {!isFactory && showDistribution && (
                <SidebarItem
                  {...itemProps({
                    href: "/dashboard/distribution",
                    icon: Boxes,
                    label: "توزيع نسك",
                  })}
                />
              )}

              {!isFactory && showCorporate && (
                <SidebarItem
                  {...itemProps({
                    href: "/dashboard/corporate",
                    icon: Handshake,
                    label: "علاقات الشركات",
                  })}
                />
              )}

              {/* Divider */}
              {!isCollapsed && (
                <div
                  className="my-3 mx-3 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              )}
              {isCollapsed && <div className="my-2" />}

              {BOTTOM_NAV
                .filter((item) => !isFactory || item.href === "/dashboard/profile")
                .map((item) => (
                  <SidebarItem key={item.href} {...itemProps(item)} />
                ))}

              {!isFactory && isSuperAdmin && (
                <SidebarItem
                  {...itemProps({
                    href: "/dashboard/approvals",
                    icon: ShieldCheck,
                    label: "الموافقات",
                  })}
                />
              )}
            </nav>
          </TooltipProvider>
        </ScrollArea>

        {/* ── Settings pinned bottom ── */}
        {!isFactory && isSuperAdmin && (
          <div
            className="p-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <TooltipProvider delayDuration={0}>
              <SidebarItem
                {...itemProps({
                  href: "/dashboard/settings",
                  icon: Settings,
                  label: "الإعدادات",
                })}
              />
            </TooltipProvider>
          </div>
        )}

        {/* Expand button (desktop, collapsed state) */}
        {isCollapsed && (
          <div
            className="p-3 border-t hidden lg:block"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "rgba(250,250,247,0.45)" }}
              aria-label="توسيع القائمة الجانبية"
            >
              <ChevronRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Sidebar item ─────────────────────────────────────────────────────────────

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
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
        isCollapsed && "justify-center px-0"
      )}
      style={
        isActive
          ? {
              background: "hsl(var(--n-forest))",
              color: "hsl(var(--n-ivory))",
            }
          : {
              color: "rgba(250,250,247,0.60)",
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.color = "hsl(var(--n-ivory))";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "";
          (e.currentTarget as HTMLElement).style.color = "rgba(250,250,247,0.60)";
        }
      }}
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0"
        style={{ color: isActive ? "hsl(var(--n-gold))" : "inherit" }}
      />
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
