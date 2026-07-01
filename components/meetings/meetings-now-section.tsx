import Link from "next/link";
import { CalendarDays, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MeetingTypeBadge,
  MeetingStatusBadge,
  MeetingPriorityBadge,
} from "./meeting-badge";
import { MeetingShortTime } from "./meeting-time";
import type { MeetingWithDetails } from "@/types/database";

interface MeetingsNowSectionProps {
  meetingsNow: MeetingWithDetails[];
  upcomingMeetings: MeetingWithDetails[];
}

function MeetingRow({ m, accentColor }: { m: MeetingWithDetails; accentColor: string }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/40 transition-colors">
      <CalendarDays className={`h-4 w-4 ${accentColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {/* Priority + Status */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <MeetingPriorityBadge priority={m.priority} />
          <MeetingStatusBadge displayStatus={m.status} />
        </div>

        {/* Title */}
        <p className="text-sm font-semibold truncate text-foreground mb-1">{m.title}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <MeetingShortTime startTime={m.start_time} endTime={m.end_time} />
          <MeetingTypeBadge type={m.meeting_type} />
          {m.organizer && (
            <span className="flex items-center gap-0.5">
              <User className="h-3 w-3" />
              {m.organizer.full_name}
            </span>
          )}
        </div>
      </div>
      <Link
        href={`/dashboard/meetings/${m.id}`}
        className="shrink-0 text-xs text-primary hover:underline px-2 py-1 rounded border border-primary/30 hover:bg-primary/5 transition-colors whitespace-nowrap"
      >
        عرض
      </Link>
    </div>
  );
}

export function MeetingsNowSection({
  meetingsNow,
  upcomingMeetings,
}: MeetingsNowSectionProps) {
  if (meetingsNow.length === 0 && upcomingMeetings.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        الاجتماعات
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Happening now */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              جارٍ الآن
              {meetingsNow.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({meetingsNow.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetingsNow.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                لا توجد اجتماعات جارية
              </p>
            ) : (
              <div className="space-y-2">
                {meetingsNow.map((m) => (
                  <MeetingRow key={m.id} m={m} accentColor="text-green-500" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              القادمة
              {upcomingMeetings.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({upcomingMeetings.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                لا توجد اجتماعات قادمة
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map((m) => (
                  <MeetingRow key={m.id} m={m} accentColor="text-sky-500" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
