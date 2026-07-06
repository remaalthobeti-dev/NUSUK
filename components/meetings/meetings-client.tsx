"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  CalendarCheck2,
  Radio,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MeetingCard } from "./meeting-card";
import { CreateMeetingDialog } from "./create-meeting-dialog";
import { sortMeetingsByPriority } from "@/types/database";
import { cn } from "@/lib/utils";
import type { MeetingWithDetails, UserRole, Team } from "@/types/database";

const TABS = [
  { key: "upcoming", label: "القادمة",  icon: CalendarClock },
  { key: "today",    label: "اليوم",    icon: CalendarDays },
  { key: "past",     label: "السابقة",  icon: CalendarCheck2 },
  { key: "all",      label: "الكل",     icon: CalendarDays },
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
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("upcoming");

  // Realtime: refresh when any meeting changes
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 600);
    };
    const channel = supabase
      .channel("meetings-list-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, trigger)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

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

  // Stats
  const liveCount = meetings.filter((m) => m.status === "in_progress").length;
  const completedCount = meetings.filter((m) => m.status === "completed").length;

  const filtered = meetings.filter((m) => {
    const start = new Date(m.start_time);
    if (tab === "upcoming") return m.status === "scheduled" && start > now;
    if (tab === "today") {
      const mStr = start.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
      return mStr === todayStr && m.status !== "cancelled";
    }
    if (tab === "past") return m.status === "completed" || m.status === "cancelled";
    return true;
  });

  const sorted =
    tab === "past"
      ? [...filtered].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      : sortMeetingsByPriority(filtered);

  // Live meetings always surface at the top of "all" and "today"
  const liveNow = meetings.filter((m) => m.status === "in_progress");
  const showLiveBanner = liveNow.length > 0 && (tab === "all" || tab === "today");

  return (
    <div className="space-y-5">
      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          label="اجتماعات اليوم"
          value={counts.today}
          icon={CalendarDays}
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          iconColor="text-blue-600 dark:text-blue-400"
          valueColor="text-blue-700 dark:text-blue-400"
        />
        <StatsCard
          label="القادمة"
          value={counts.upcoming}
          icon={CalendarClock}
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
          valueColor="text-amber-700 dark:text-amber-400"
        />
        <StatsCard
          label="جارٍ الآن"
          value={liveCount}
          icon={Radio}
          iconBg={liveCount > 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/50"}
          iconColor={liveCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
          valueColor={liveCount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}
          pulse={liveCount > 0}
        />
        <StatsCard
          label="مكتملة"
          value={completedCount}
          icon={CalendarCheck2}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-500 dark:text-slate-400"
          valueColor="text-slate-600 dark:text-slate-400"
        />
      </div>

      {/* ── Live now banner ── */}
      {showLiveBanner && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              جارٍ الآن — {liveNow.length === 1 ? "اجتماع واحد" : `${liveNow.length} اجتماعات`}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {liveNow.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                currentEmployeeId={currentEmployeeId}
                displayStatus="in_progress"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab bar + create ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="rounded-2xl border bg-card p-1.5 flex gap-1 flex-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 flex-1 min-w-fit rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center tabular-nums",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {canCreate && (
          <CreateMeetingDialog role={role} employeeTeamId={employeeTeamId} teams={teams} />
        )}
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-1.5 h-4 rounded-full shrink-0",
            tab === "upcoming" && "bg-amber-400",
            tab === "today"    && "bg-blue-500",
            tab === "past"     && "bg-slate-400",
            tab === "all"      && "bg-primary"
          )}
        />
        <h2 className="text-sm font-semibold text-foreground">
          {TABS.find((t) => t.key === tab)?.label}
        </h2>
        <span className="text-xs text-muted-foreground">({sorted.length} اجتماع)</span>
      </div>

      {/* ── Meeting grid ── */}
      {sorted.length === 0 ? (
        <EmptyState tab={tab} />
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

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
        {pulse && (
          <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold tabular-nums leading-none", valueColor)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, { title: string; sub: string }> = {
    upcoming: { title: "لا توجد اجتماعات قادمة",  sub: "لم يُجدوَّل أي اجتماع بعد" },
    today:    { title: "لا توجد اجتماعات اليوم",   sub: "استمتع بيوم خالٍ من الاجتماعات" },
    past:     { title: "لا توجد اجتماعات سابقة",   sub: "لم تُنهَ أو تُلغَ أي اجتماعات بعد" },
    all:      { title: "لا توجد اجتماعات",          sub: "ابدأ بإنشاء اجتماع جديد" },
  };
  const msg = messages[tab];
  return (
    <div className="rounded-2xl border border-dashed bg-muted/10 flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{msg.title}</p>
        <p className="text-sm text-muted-foreground mt-1.5">{msg.sub}</p>
      </div>
    </div>
  );
}
