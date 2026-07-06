import Link from "next/link";
import { MapPin, Link2, User, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MeetingTypeBadge, MeetingStatusBadge, MeetingPriorityBadge } from "./meeting-badge";
import { MeetingTime, MeetingShortTime } from "./meeting-time";
import type { MeetingWithDetails, RsvpResponse, MeetingDisplayStatus } from "@/types/database";

const STATUS_BORDER: Record<MeetingDisplayStatus, string> = {
  scheduled:   "border-s-blue-400",
  in_progress: "border-s-emerald-500",
  completed:   "border-s-slate-300 dark:border-s-slate-600",
  cancelled:   "border-s-red-400",
};

const RSVP_CHIP: Record<RsvpResponse, { label: string; className: string }> = {
  attending:     { label: "سأحضر",  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  maybe:         { label: "ربما",   className: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
  not_attending: { label: "اعتذار", className: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400" },
};

function getDurationLabel(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} د`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}س ${m}د` : `${h} ساعة`;
}

interface MeetingCardProps {
  meeting: MeetingWithDetails;
  currentEmployeeId: string;
  displayStatus: MeetingDisplayStatus;
}

export function MeetingCard({ meeting, currentEmployeeId, displayStatus }: MeetingCardProps) {
  const myRsvp = meeting.rsvps.find((r) => r.employee_id === currentEmployeeId);
  const rsvpChip = myRsvp ? RSVP_CHIP[myRsvp.response] : null;
  const isOver = displayStatus === "completed" || displayStatus === "cancelled";
  const isLive = displayStatus === "in_progress";
  const duration = getDurationLabel(meeting.start_time, meeting.end_time);
  const rsvpCount = meeting.rsvps.length;

  return (
    <Link href={`/dashboard/meetings/${meeting.id}`} className="block group">
      <div
        className={cn(
          "rounded-2xl border bg-card overflow-hidden flex flex-col",
          "transition-all duration-200",
          "hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.28)]",
          "hover:-translate-y-0.5",
          "border-s-[3px]",
          STATUS_BORDER[displayStatus],
          isOver && "opacity-60",
          isLive && "ring-1 ring-emerald-500/20 dark:ring-emerald-400/20"
        )}
      >
        {/* ── Top: time + status ── */}
        <div className="px-4 pt-4 pb-2.5 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground/80 mb-0.5">
              <MeetingShortTime startTime={meeting.start_time} endTime={meeting.end_time} />
            </p>
            <p className="text-[10px] text-muted-foreground/60 leading-none">
              <MeetingTime
                startTime={meeting.start_time}
                endTime={meeting.end_time}
                className="text-[10px] text-muted-foreground/60"
              />
            </p>
          </div>
          <MeetingStatusBadge displayStatus={displayStatus} />
        </div>

        {/* ── Title ── */}
        <div className="px-4 pb-2.5 flex-1">
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {meeting.title}
          </h3>
        </div>

        {/* ── Badges ── */}
        <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
          <MeetingTypeBadge type={meeting.meeting_type} />
          <MeetingPriorityBadge priority={meeting.priority} />
          {rsvpChip && (
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", rsvpChip.className)}>
              {rsvpChip.label}
            </span>
          )}
        </div>

        {/* ── Footer: organizer + meta ── */}
        <div className="px-4 py-2.5 border-t border-dashed border-border/50 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 truncate flex-1 min-w-0">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{meeting.organizer?.full_name ?? "—"}</span>
          </span>

          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {duration}
          </span>

          {rsvpCount > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <Users className="h-3 w-3" />
              {rsvpCount}
            </span>
          )}

          {meeting.location && (
            <span className="flex items-center gap-1 shrink-0 max-w-[80px] truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{meeting.location}</span>
            </span>
          )}
          {meeting.meeting_link && !meeting.location && (
            <span className="flex items-center gap-1 shrink-0">
              <Link2 className="h-3 w-3" />
              رابط
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
