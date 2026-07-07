import { Users } from "lucide-react";
import type { AvailabilityStatus } from "@/types/database";
import { STATUS_CONFIG } from "./status-config";

interface TeamStatsProps {
  summary: Record<AvailabilityStatus, number>;
  total: number;
  teamColor: string;
}

const STAT_ORDER: AvailabilityStatus[] = [
  "available",
  "busy",
  "in_meeting",
  "field_work",
  "remote",
  "offline",
];

export function TeamStats({ summary, total, teamColor }: TeamStatsProps) {
  const present = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {/* Total */}
      <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1 col-span-1 transition-shadow duration-200 hover:shadow-sm">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 shrink-0"
          style={{ background: `${teamColor}20` }}
        >
          <Users className="h-4 w-4" style={{ color: teamColor }} />
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{present}</p>
        <p className="text-xs text-muted-foreground font-medium">إجمالي الموظفين</p>
      </div>

      {/* Per-status cards */}
      {STAT_ORDER.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const count = summary[status];
        return (
          <div
            key={status}
            className="rounded-2xl border bg-card p-4 flex flex-col gap-1 transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 shrink-0"
              style={{ background: "hsl(var(--n-gold) / .07)" }}>
              <span
                className={`w-3 h-3 rounded-full ${cfg.dotClass} ${
                  status === "available" ? "animate-pulse" : ""
                }`}
              />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{count}</p>
            <p className="text-xs text-muted-foreground font-medium">{cfg.label}</p>
          </div>
        );
      })}
    </div>
  );
}
