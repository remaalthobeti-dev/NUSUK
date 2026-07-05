import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/database";
import { TEAM_EMOJI } from "./status-config";

interface TeamCardProps {
  team: Team;
  employeeCount?: number;
  presenceCounts?: Partial<Record<string, number>>;
}

export function TeamCard({
  team,
  employeeCount = 0,
  presenceCounts = {},
}: TeamCardProps) {
  const emoji = TEAM_EMOJI[team.icon ?? ""] ?? "👥";
  const available = presenceCounts.available ?? 0;
  const busy = presenceCounts.busy ?? 0;

  return (
    <Link
      href={`/dashboard/${team.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6 h-52",
          "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md",
          "shadow-md hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:scale-[1.01]",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring"
        )}
      >
        {/* Colored top bar */}
        <div
          className="absolute top-0 inset-x-0 h-1.5 rounded-t-2xl"
          style={{ background: team.color }}
        />

        {/* Background glow */}
        <div
          className="absolute -top-10 -end-10 w-40 h-40 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
          style={{ background: team.color }}
        />

        {/* Emoji icon */}
        <div className="text-5xl mb-4 select-none">{emoji}</div>

        {/* Team name */}
        <h3 className="font-bold text-xl text-foreground leading-snug mb-1">
          {team.name}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {employeeCount} موظف
          </span>
          {available > 0 && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {available} متاح
            </span>
          )}
          {busy > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {busy} مشغول
            </span>
          )}
        </div>

        {/* Arrow */}
        <div className="absolute bottom-5 start-5 opacity-0 group-hover:opacity-100 transition-all duration-200 ltr:-translate-x-1 rtl:translate-x-1 group-hover:translate-x-0">
          <ArrowLeft
            className="h-5 w-5 rtl:rotate-180"
            style={{ color: team.color }}
          />
        </div>
      </div>
    </Link>
  );
}
