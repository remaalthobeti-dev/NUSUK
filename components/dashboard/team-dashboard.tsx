"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { EmployeeWithPresence, ActivityLog, Team } from "@/types/database";
import type { AvailabilityStatus } from "@/types/database";
import { TeamStats } from "./team-stats";
import { EmployeeCard } from "./employee-card";
import { EmployeeDrawer } from "./employee-drawer";
import { TEAM_EMOJI } from "./status-config";

interface TeamDashboardProps {
  team: Team;
  employees: EmployeeWithPresence[];
  presenceSummary: Record<AvailabilityStatus, number>;
  totalPresent: number;
  timelineMap: Record<string, ActivityLog[]>;
}

export function TeamDashboard({
  team,
  employees,
  presenceSummary,
  totalPresent,
  timelineMap,
}: TeamDashboardProps) {
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithPresence | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openEmployee(emp: EmployeeWithPresence) {
    setSelectedEmployee(emp);
    setDrawerOpen(true);
  }

  const emoji = TEAM_EMOJI[team.icon ?? ""] ?? "👥";
  const timeline = selectedEmployee
    ? (timelineMap[selectedEmployee.id] ?? [])
    : [];

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
          {/* Colored accent bar */}
          <div
            className="h-8 w-1 rounded-full ms-2 hidden sm:block"
            style={{ background: team.color }}
          />
        </div>
      </div>

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

      {/* Employee Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          الموظفون ({employees.length})
        </h2>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-16 text-center">
          <p className="text-muted-foreground">لا يوجد موظفون في هذا الفريق</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onClick={() => openEmployee(emp)}
            />
          ))}
        </div>
      )}

      {/* Employee Drawer */}
      <EmployeeDrawer
        employee={selectedEmployee}
        timeline={timeline}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
