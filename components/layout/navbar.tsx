"use client";

import { useTheme } from "next-themes";
import { Menu, Moon, Sun, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLabel } from "@/lib/utils";

interface NavbarProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Navbar({ onMobileMenuToggle, sidebarCollapsed }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, employee } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = employee?.full_name
    ? employee.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
    : user?.email?.[0]?.toUpperCase() ?? "U";

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

      {/* Page title placeholder — filled by individual pages */}
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
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="الإشعارات"
          onClick={() => router.push("/dashboard/notifications")}
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-0.5 -end-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
            3
          </Badge>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9"
              aria-label="قائمة المستخدم"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={employee?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-start leading-tight">
                <p className="text-xs font-medium text-foreground">
                  {employee?.full_name ?? user?.email ?? "مستخدم"}
                </p>
                {employee?.role && (
                  <p className="text-[10px] text-muted-foreground">
                    {getRoleLabel(employee.role)}
                  </p>
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
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
    </header>
  );
}
