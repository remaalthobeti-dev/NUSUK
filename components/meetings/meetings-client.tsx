"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { MeetingCard } from "./meeting-card";
import { CreateMeetingDialog } from "./create-meeting-dialog";
import { sortMeetingsByPriority } from "@/types/database";
import type { MeetingWithDetails, UserRole, Team } from "@/types/database";

const TABS = [
  { key: "upcoming", label: "القادمة" },
  { key: "today", label: "اليوم" },
  { key: "past", label: "السابقة" },
  { key: "all", label: "الكل" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface MeetingsClientProps {
  meetings: MeetingWithDetails[];
  currentEmployeeId: string;
  role: UserRole;
  employeeTeamId: string | null;
  teams: Team[];
  canCreate: boolean;
}

export function MeetingsClient({
  meetings,
  currentEmployeeId,
  role,
  employeeTeamId,
  teams,
  canCreate,
}: MeetingsClientProps) {
  const [tab, setTab] = useState<TabKey>("upcoming");

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

  const filtered = meetings.filter((m) => {
    const start = new Date(m.start_time);
    if (tab === "upcoming") {
      return m.status === "scheduled" && start > now;
    }
    if (tab === "today") {
      const mStr = start.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
      return mStr === todayStr && m.status !== "cancelled";
    }
    if (tab === "past") {
      return m.status === "completed" || m.status === "cancelled";
    }
    return true;
  });

  // For past: newest first. Otherwise: priority → start_time
  const sorted =
    tab === "past"
      ? [...filtered].sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )
      : sortMeetingsByPriority(filtered);

  // Tab counts
  const counts = {
    upcoming: meetings.filter((m) => m.status === "scheduled" && new Date(m.start_time) > now).length,
    today: meetings.filter((m) => {
      const mStr = new Date(m.start_time).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
      return mStr === todayStr && m.status !== "cancelled";
    }).length,
    past: meetings.filter((m) => m.status === "completed" || m.status === "cancelled").length,
    all: meetings.length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                  }`}
                >
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {canCreate && (
          <CreateMeetingDialog role={role} employeeTeamId={employeeTeamId} teams={teams} />
        )}
      </div>

      {/* Meeting grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد اجتماعات في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              currentEmployeeId={currentEmployeeId}
              displayStatus={m.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
