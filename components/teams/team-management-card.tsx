"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ChevronLeft,
  MoreVertical,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Users,
  CheckCircle2,
  CircleDot,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { restoreTeamAction } from "@/app/(dashboard)/dashboard/teams/actions";
import type { TeamWithStats } from "@/lib/data/teams-management";

const ICON_EMOJI: Record<string, string> = {
  handshake: "🤝",
  truck: "📦",
  cpu: "💻",
  settings: "⚙️",
  users: "👥",
  shield: "🛡️",
  star: "⭐",
  chart: "📊",
  target: "🎯",
  globe: "🌐",
};

interface Props {
  team: TeamWithStats;
  isSuperAdmin: boolean;
  onEdit: (team: TeamWithStats) => void;
  onArchive: (team: TeamWithStats) => void;
  onDelete: (team: TeamWithStats) => void;
}

export function TeamManagementCard({
  team,
  isSuperAdmin,
  onEdit,
  onArchive,
  onDelete,
}: Props) {
  const [isRestoring, startRestore] = useTransition();
  const emoji = team.icon ? (ICON_EMOJI[team.icon] ?? "👥") : "👥";

  function handleRestore() {
    startRestore(async () => {
      const { error } = await restoreTeamAction(team.id);
      if (error) toast.error(error);
      else toast.success("تمت استعادة الفريق بنجاح");
    });
  }

  return (
    <div
      className={cn(
        "relative group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all",
        !team.is_active && "opacity-60"
      )}
    >
      {/* Archived Badge */}
      {!team.is_active && (
        <div className="absolute top-3 start-3">
          <Badge variant="outline" className="text-[10px] bg-muted/50">
            مؤرشف
          </Badge>
        </div>
      )}

      {/* Actions Menu (super_admin only) */}
      {isSuperAdmin && (
        <div className="absolute top-3 end-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(team)} className="gap-2">
                <Pencil className="h-4 w-4" />
                تعديل الفريق
              </DropdownMenuItem>
              {team.is_active ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onArchive(team)}
                    className="gap-2 text-amber-600 focus:text-amber-600"
                  >
                    <Archive className="h-4 w-4" />
                    أرشفة الفريق
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(team)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف نهائياً
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="gap-2 text-emerald-600 focus:text-emerald-600"
                  >
                    <RotateCcw className="h-4 w-4" />
                    استعادة الفريق
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(team)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف نهائياً
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 pe-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${team.color}22` }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{team.name}</h3>
          {team.name_en && (
            <p
              className="text-xs text-muted-foreground mt-0.5 truncate"
              dir="ltr"
            >
              {team.name_en}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{team.description}</p>
      )}

      {/* Member + Availability Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCell
          icon={<Users className="h-3 w-3" />}
          value={team.memberCount}
          label="موظف"
        />
        <StatCell
          icon={<CircleDot className="h-3 w-3 text-emerald-500" />}
          value={team.presentCount}
          label="حاضر"
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatCell
          icon={<CheckCircle2 className="h-3 w-3 text-blue-500" />}
          value={team.availableCount}
          label="متاح"
          color="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Task Stats */}
      <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">المهام</span>
        </div>
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="text-amber-600 font-medium">{team.stats.inProgressTasks} جارية</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-emerald-600 font-medium">{team.stats.completedTasks} مكتملة</span>
        </div>
      </div>

      {/* Availability Bar + Link */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">نسبة التوافر</span>
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: team.color }}
          >
            {team.memberCount > 0
              ? Math.round((team.availableCount / team.memberCount) * 100)
              : 0}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:
                team.memberCount > 0
                  ? `${Math.round((team.availableCount / team.memberCount) * 100)}%`
                  : "0%",
              background: team.color,
            }}
          />
        </div>
      </div>

      {/* View Detail Link */}
      {team.is_active && (
        <Link
          href={`/dashboard/${team.id}`}
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 rounded-lg hover:bg-muted/50"
        >
          <span>عرض تفاصيل الفريق</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function StatCell({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="text-center bg-muted/40 rounded-lg py-2 px-1">
      <div className="flex items-center justify-center gap-0.5 mb-0.5">
        {icon}
        <p className={cn("text-base font-bold tabular-nums leading-none", color ?? "text-foreground")}>
          {value}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
