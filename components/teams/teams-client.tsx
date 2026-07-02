"use client";

import Link from "next/link";
import { Users, User, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamDirectoryEntry } from "@/lib/data/teams-directory";

interface Props {
  teams: TeamDirectoryEntry[];
}

export function TeamsClient({ teams }: Props) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="font-medium">لا توجد فرق نشطة</p>
        <p className="text-sm text-muted-foreground">تواصل مع مدير النظام لإعداد الفرق</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: TeamDirectoryEntry }) {
  const availablePct =
    team.employeeCount > 0
      ? Math.round((team.availableCount / team.employeeCount) * 100)
      : 0;

  return (
    <Link
      href={`/dashboard/${team.id}`}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${team.color}22` }}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: team.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">{team.name}</h3>
          {team.name_en && (
            <p className="text-xs text-muted-foreground mt-0.5 font-latin" dir="ltr">
              {team.name_en}
            </p>
          )}
        </div>
        <ChevronLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {team.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCell value={team.employeeCount} label="موظف" />
        <StatCell value={team.presentCount} label="حاضر" color="text-emerald-600 dark:text-emerald-400" />
        <StatCell value={team.availableCount} label="متاح" color="text-blue-600 dark:text-blue-400" />
      </div>

      {/* Availability bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">نسبة التوافر</span>
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: team.color }}>
            {availablePct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${availablePct}%`, background: team.color }}
          />
        </div>
      </div>
    </Link>
  );
}

function StatCell({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="text-center bg-muted/40 rounded-lg py-2">
      <p className={cn("text-lg font-bold tabular-nums leading-none", color ?? "text-foreground")}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
