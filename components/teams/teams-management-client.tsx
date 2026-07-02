"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRealtimeTeams } from "@/hooks/use-realtime-teams";
import { TeamManagementCard } from "./team-management-card";
import { TeamFormDialog } from "./team-form-dialog";
import { ArchiveConfirmDialog } from "./archive-confirm-dialog";
import type { TeamWithStats } from "@/lib/data/teams-management";

type Filter = "active" | "archived" | "all";

interface Props {
  teams: TeamWithStats[];
  isSuperAdmin: boolean;
}

export function TeamsManagementClient({ teams, isSuperAdmin }: Props) {
  useRealtimeTeams();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithStats | null>(null);
  const [confirmTeam, setConfirmTeam] = useState<TeamWithStats | null>(null);
  const [confirmMode, setConfirmMode] = useState<"archive" | "delete">("archive");

  const filtered = useMemo(() => {
    let result = teams;

    if (filter === "active") result = result.filter((t) => t.is_active);
    else if (filter === "archived") result = result.filter((t) => !t.is_active);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.name_en ?? "").toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [teams, filter, search]);

  const activeCount = teams.filter((t) => t.is_active).length;
  const archivedCount = teams.filter((t) => !t.is_active).length;

  function openEdit(team: TeamWithStats) {
    setEditingTeam(team);
    setFormOpen(true);
  }

  function openArchive(team: TeamWithStats) {
    setConfirmTeam(team);
    setConfirmMode("archive");
  }

  function openDelete(team: TeamWithStats) {
    setConfirmTeam(team);
    setConfirmMode("delete");
  }

  const filterOptions: Array<{ value: Filter; label: string; count: number }> = [
    { value: "active", label: "نشطة", count: activeCount },
    ...(isSuperAdmin
      ? [
          { value: "archived" as Filter, label: "مؤرشفة", count: archivedCount },
          { value: "all" as Filter, label: "الكل", count: teams.length },
        ]
      : []),
  ];

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الفريق أو وصفه…"
            className="pe-9"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                filter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums px-1.5 py-0 rounded-full",
                  filter === opt.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        {isSuperAdmin && (
          <Button
            onClick={() => {
              setEditingTeam(null);
              setFormOpen(true);
            }}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            فريق جديد
          </Button>
        )}
      </div>

      {/* Results label */}
      {search.trim() && (
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} نتيجة للبحث عن "{search}"
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          isFiltered={!!search.trim() || filter !== "active"}
          isSuperAdmin={isSuperAdmin}
          onCreate={() => {
            setEditingTeam(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <TeamManagementCard
              key={team.id}
              team={team}
              isSuperAdmin={isSuperAdmin}
              onEdit={openEdit}
              onArchive={openArchive}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <TeamFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTeam(null);
        }}
        team={editingTeam}
      />

      {/* Archive / Delete Confirmation */}
      <ArchiveConfirmDialog
        team={confirmTeam}
        mode={confirmMode}
        open={!!confirmTeam}
        onOpenChange={(open) => {
          if (!open) setConfirmTeam(null);
        }}
      />
    </>
  );
}

function EmptyState({
  isFiltered,
  isSuperAdmin,
  onCreate,
}: {
  isFiltered: boolean;
  isSuperAdmin: boolean;
  onCreate: () => void;
}) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="font-medium">لا توجد نتائج</p>
        <p className="text-sm text-muted-foreground">جرّب تغيير معايير البحث أو الفلتر</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Users className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <div>
        <p className="font-semibold text-lg">لا توجد فرق بعد</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isSuperAdmin
            ? "أنشئ أول فريق لتنظيم الموظفين وتوزيع المهام"
            : "تواصل مع مدير النظام لإعداد الفرق"}
        </p>
      </div>
      {isSuperAdmin && (
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء أول فريق
        </Button>
      )}
    </div>
  );
}

export function TeamsManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
