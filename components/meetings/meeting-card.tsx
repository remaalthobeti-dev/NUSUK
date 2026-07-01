import Link from "next/link";
import { MapPin, Link2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MeetingTypeBadge, MeetingStatusBadge, MeetingPriorityBadge } from "./meeting-badge";
import { MeetingTime } from "./meeting-time";
import type { MeetingWithDetails, RsvpResponse, MeetingDisplayStatus } from "@/types/database";

const RSVP_CHIP: Record<RsvpResponse, { label: string; className: string }> = {
  attending: {
    label: "حضور",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  maybe: {
    label: "ربما",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  not_attending: {
    label: "اعتذار",
    className: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
};

interface MeetingCardProps {
  meeting: MeetingWithDetails;
  currentEmployeeId: string;
  displayStatus: MeetingDisplayStatus;
}

export function MeetingCard({ meeting, currentEmployeeId, displayStatus }: MeetingCardProps) {
  const myRsvp = meeting.rsvps.find((r) => r.employee_id === currentEmployeeId);
  const rsvpChip = myRsvp ? RSVP_CHIP[myRsvp.response] : null;
  const isOver = displayStatus === "completed" || displayStatus === "cancelled";

  return (
    <Link href={`/dashboard/meetings/${meeting.id}`}>
      <Card
        className={cn(
          "hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer h-full",
          isOver && "opacity-60"
        )}
      >
        <CardContent className="p-4 flex flex-col h-full">
          {/* Priority + Status row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <MeetingPriorityBadge priority={meeting.priority} />
            <MeetingStatusBadge displayStatus={displayStatus} />
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2 flex-1">
            {meeting.title}
          </h3>

          {/* Type + RSVP badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <MeetingTypeBadge type={meeting.meeting_type} />
            {rsvpChip && (
              <span
                className={cn("text-xs font-medium px-2 py-0.5 rounded-full", rsvpChip.className)}
              >
                {rsvpChip.label}
              </span>
            )}
          </div>

          {/* Time */}
          <p className="text-xs text-muted-foreground mb-2">
            <MeetingTime startTime={meeting.start_time} endTime={meeting.end_time} />
          </p>

          {/* Organizer + location */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{meeting.organizer?.full_name ?? "—"}</span>
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{meeting.location}</span>
              </span>
            )}
            {meeting.meeting_link && !meeting.location && (
              <span className="flex items-center gap-1 shrink-0">
                <Link2 className="h-3 w-3" />
                رابط
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
