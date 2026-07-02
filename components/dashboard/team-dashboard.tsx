"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ClipboardList, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import type { EmployeeWithPresence, Team } from "@/types/database";
import type { AvailabilityStatus } from "@/types/database";
import { TeamStats } from "./team-stats";
import { EmployeeCard } from "./employee-card";
import { EmployeeDrawer } from "./employee-drawer";
import { SearchFilters } from "./search-filters";
import { AlertsPanel } from "./alerts-panel";
import { UpdateStatusDialog } from "./update-status-dialog";
import { AssignTaskDialog } from "./assign-task-dialog";
import { TEAM_EMOJI } from "./status-config";
import { useRealtimeTeam } from "@/hooks/use-realtime-team";
import { useAlertChecker } from "@/hooks/use-alert-checker";
import { Button } from "@/components/ui/button";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import type { TeamWithStats } from "@/lib/data/teams-management";

interface TeamDashboardProps {
  team: Team;
  employees: EmployeeWithPresence[];
  presenceSummary: Record<AvailabilityStatus, number>;
  totalPresent: number;
  isSuperAdmin?: boolean;
}

export function TeamDashboard({
  team,
  employees: initialEmployees,
  presenceSummary: initialSummary,
  totalPresent: initialTotal,
  isSuperAdmin = false,
}: TeamDashboardProps) {
  const { employees } = useRealtimeTeam(team.id, initialEmployees);
  const { alerts, dismiss, dismissAll } = useAlertChecker(employees);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithPresence | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updateStatusEmployee, setUpdateStatusEmployee] = useState<EmployeeWithPresence | null>(null);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<AvailabilityStatus[]>([]);

  function openEmployee(emp: EmployeeWithPresence) {
    setSelectedEmployee(emp);
    setDrawerOpen(true);
  }

  function toggleFilter(s: AvailabilityStatus) {
    setActiveFilters((prev) =>
      prev.includes(s) ? prev.filter((f) => f !== s) : [...prev, s]
    );
  }

  function clearAll() {
    setSearchQuery("");
    setActiveFilters([]);
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (activeFilters.length > 0) {
        const status = emp.presence?.availability_status ?? "available";
        if (!activeFilters.includes(status)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = emp.full_name.toLowerCase().includes(q);
        const matchTask = emp.current_task?.title.toLowerCase().includes(q) ?? false;
        const matchStatus = (emp.presence?.availability_status ?? "").includes(q);
        if (!matchName && !matchTask && !matchStatus) return false;
      }
      return true;
    });
  }, [employees, searchQuery, activeFilters]);

  // Recompute presence summary from realtime employees
  const presenceSummary = useMemo(() => {
    const summary = { ...initialSummary } as Record<AvailabilityStatus, number>;
    const statuses: AvailabilityStatus[] = ["available", "busy", "in_meeting", "field_work", "remote", "offline"];
    statuses.forEach((s) => (summary[s] = 0));
    employees.forEach((emp) => {
      const s = emp.presence?.availability_status;
      if (s) summary[s] = (summary[s] ?? 0) + 1;
    });
    return summary;
  }, [employees, initialSummary]);

  const totalPresent = useMemo(
    () => employees.filter((e) => e.presence?.availability_status).length,
    [employees]
  );

  const emoji = TEAM_EMOJI[team.icon ?? ""] ?? "👥";

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
          الرئيسية
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{team.name}</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-4xl select-none">{emoji}</span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {team.description}
                </p>
              )}
            </div>
            <div
              className="h-8 w-1 rounded-full ms-2 hidden sm:block"
              style={{ background: team.color }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditTeamOpen(true)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                تعديل الفريق
              </Button>
            )}
            <Button
              onClick={() => setAssignTaskOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <ClipboardList className="h-4 w-4" />
              تكليف مهمة جديدة
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <AlertsPanel alerts={alerts} onDismiss={dismiss} onDismissAll={dismissAll} />
        </div>
      )}

      {/* Stats */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          ملخص الحضور
        </h2>
        <TeamStats
          summary={presenceSummary}
          total={totalPresent}
          teamColor={team.color}
        />
      </div>

      {/* Search & Filters */}
      <div className="mb-6">
        <SearchFilters
          searchQuery={searchQuery}
          activeFilters={activeFilters}
          onSearchChange={setSearchQuery}
          onFilterToggle={toggleFilter}
          onClearAll={clearAll}
          resultCount={filteredEmployees.length}
          totalCount={employees.length}
        />
      </div>

      {/* Employee Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          الموظفون ({filteredEmployees.length})
        </h2>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-muted-foreground">
            {employees.length === 0
              ? "لا يوجد موظفون في هذا الفريق"
              : "لا توجد نتائج تطابق البحث"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onClick={() => openEmployee(emp)}
              onUpdateStatus={() => setUpdateStatusEmployee(emp)}
            />
          ))}
        </div>
      )}

      {/* Employee Drawer */}
      <EmployeeDrawer
        employee={selectedEmployee}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdateStatus={() => {
          if (selectedEmployee) setUpdateStatusEmployee(selectedEmployee);
        }}
      />

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        employee={updateStatusEmployee}
        open={!!updateStatusEmployee}
        onOpenChange={(open) => {
          if (!open) setUpdateStatusEmployee(null);
        }}
      />

      {/* Assign Task Dialog */}
      <AssignTaskDialog
        employees={employees}
        teamId={team.id}
        open={assignTaskOpen}
        onOpenChange={setAssignTaskOpen}
      />

      {/* Edit Team Dialog (super_admin only) */}
      {isSuperAdmin && (
        <TeamFormDialog
          open={editTeamOpen}
          onOpenChange={setEditTeamOpen}
          team={team as unknown as TeamWithStats}
        />
      )}
    </>
  );
}
