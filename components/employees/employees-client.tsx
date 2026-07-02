"use client";

import { useState, useMemo } from "react";
import { Search, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/utils";
import type { EmployeeDirectoryEntry } from "@/lib/data/employees-directory";
import type { UserRole } from "@/types/database";

// Availability status labels + dot colours (mirrors status-config without importing it client-side)
const PRESENCE_CONFIG: Record<
  string,
  { label: string; dot: string }
> = {
  available:  { label: "متاح",        dot: "bg-emerald-500" },
  busy:       { label: "مشغول",       dot: "bg-amber-500" },
  in_meeting: { label: "في اجتماع",  dot: "bg-blue-500" },
  field_work: { label: "عمل ميداني", dot: "bg-purple-500" },
  remote:     { label: "عن بعد",      dot: "bg-cyan-500" },
  offline:    { label: "خارج الدوام", dot: "bg-slate-400" },
};

const ROLE_OPTIONS: Array<{ value: UserRole | "all"; label: string }> = [
  { value: "all", label: "جميع الأدوار" },
  { value: "super_admin", label: "مدير النظام" },
  { value: "track_manager", label: "مشرف المسار" },
  { value: "team_member", label: "عضو الفريق" },
];

interface Props {
  employees: EmployeeDirectoryEntry[];
  isSuperAdmin: boolean;
}

export function EmployeesClient({ employees, isSuperAdmin }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const filtered = useMemo(() => {
    let result = employees;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.job_title ?? "").toLowerCase().includes(q) ||
          (e.teamName ?? "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((e) => e.role === roleFilter);
    }
    return result;
  }, [employees, search, roleFilter]);

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <UserCheck className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="font-medium">لا يوجد موظفون</p>
        <p className="text-sm text-muted-foreground">يمكن إضافة الموظفين من صفحة الإعدادات</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو الفريق…"
            className="pe-9"
          />
        </div>
        {isSuperAdmin && (
          <div className="flex gap-1 flex-wrap">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  roleFilter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} من {employees.length} موظف
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <p className="text-sm font-medium">لا توجد نتائج</p>
          <p className="text-xs text-muted-foreground">جرّب تغيير معايير البحث</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-right font-semibold text-xs text-muted-foreground px-4 py-3 whitespace-nowrap">الموظف</th>
                  <th className="text-right font-semibold text-xs text-muted-foreground px-4 py-3 whitespace-nowrap">الدور</th>
                  {isSuperAdmin && (
                    <th className="text-right font-semibold text-xs text-muted-foreground px-4 py-3 whitespace-nowrap">الفريق</th>
                  )}
                  <th className="text-right font-semibold text-xs text-muted-foreground px-4 py-3 whitespace-nowrap">الحالة</th>
                  <th className="text-right font-semibold text-xs text-muted-foreground px-4 py-3 whitespace-nowrap">عبء العمل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <EmployeeRow key={emp.id} emp={emp} isSuperAdmin={isSuperAdmin} isLast={i === filtered.length - 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeRow({
  emp,
  isSuperAdmin,
  isLast,
}: {
  emp: EmployeeDirectoryEntry;
  isSuperAdmin: boolean;
  isLast: boolean;
}) {
  const initials = emp.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  const presence = emp.availabilityStatus
    ? PRESENCE_CONFIG[emp.availabilityStatus]
    : null;

  return (
    <tr className={cn("hover:bg-muted/30 transition-colors", !isLast && "border-b border-border")}>
      {/* Employee */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm leading-tight">{emp.full_name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{emp.email}</p>
            {emp.job_title && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{emp.job_title}</p>
            )}
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {getRoleLabel(emp.role)}
        </Badge>
      </td>

      {/* Team (super admin only) */}
      {isSuperAdmin && (
        <td className="px-4 py-3">
          {emp.teamName ? (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: emp.teamColor ?? "#ccc" }}
              />
              <span className="text-sm">{emp.teamName}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">غير محدد</span>
          )}
        </td>
      )}

      {/* Status */}
      <td className="px-4 py-3">
        {presence ? (
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full shrink-0", presence.dot)} />
            <span className="text-xs">{presence.label}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Workload */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                emp.workloadPercent >= 70 ? "bg-red-500" : "bg-emerald-500"
              )}
              style={{ width: `${emp.workloadPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-left">
            {emp.workloadPercent}%
          </span>
        </div>
      </td>
    </tr>
  );
}
