"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, LogOut, User, ChevronDown, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useMyPresence } from "@/hooks/use-my-presence";
import { getRoleLabel } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MyStatusDialog } from "@/components/shared/my-status-dialog";
import { STATUS_CONFIG } from "@/components/dashboard/status-config";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Navbar({ onMobileMenuToggle, sidebarCollapsed }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, employee } = useAuth();
  const { presence, refetch } = useMyPresence();
  const router = useRouter();
  const [statusOpen, setStatusOpen] = useState(false);

  function handleSignOut() {
    window.location.href = "/api/auth/logout";
  }

  const initials = employee?.full_name
    ? employee.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const currentStatus = presence?.availability_status ?? "available";
  const statusCfg = STATUS_CONFIG[currentStatus];

  return (
    <header
      className="fixed top-0 start-0 z-20 h-[var(--navbar-height)] bg-card border-b flex items-center px-4 gap-3 transition-all duration-300 ease-in-out"
      style={{
        insetInlineEnd: sidebarCollapsed
          ? "var(--sidebar-collapsed-width)"
          : "var(--sidebar-width)",
        insetInlineStart: 0,
      }}
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMobileMenuToggle}
        className="lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title placeholder */}
      <div className="flex-1" id="navbar-title" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="تبديل المظهر"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <NotificationBell employeeId={employee?.id ?? null} />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9"
              aria-label="قائمة المستخدم"
            >
              {/* Avatar with status dot */}
              <span className="relative shrink-0">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={employee?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                    statusCfg.dotClass,
                    currentStatus === "available" && "animate-pulse"
                  )}
                />
              </span>

              <div className="hidden sm:block text-start leading-tight">
                <p className="text-xs font-medium text-foreground">
                  {employee?.full_name ?? user?.email ?? "مستخدم"}
                </p>
                <p className={cn("text-[10px]", statusCfg.textClass)}>
                  {statusCfg.label}
                  {presence?.notes && (
                    <span className="text-muted-foreground"> · {presence.notes}</span>
                  )}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {employee?.full_name ?? "مستخدم"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Current status indicator */}
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
                <span className={cn("w-2 h-2 rounded-full shrink-0", statusCfg.dotClass, currentStatus === "available" && "animate-pulse")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium", statusCfg.textClass)}>
                    {statusCfg.label}
                  </p>
                  {presence?.notes && (
                    <p className="text-[10px] text-muted-foreground truncate">{presence.notes}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Change status */}
            <DropdownMenuItem onClick={() => setStatusOpen(true)}>
              <Activity className="h-4 w-4" />
              تغيير حالتي
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="h-4 w-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Self-service status dialog */}
      <MyStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        currentStatus={currentStatus}
        currentNote={presence?.notes}
        onSuccess={refetch}
      />
    </header>
  );
}
