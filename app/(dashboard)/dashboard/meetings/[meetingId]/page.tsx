import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Link2, CalendarDays, User, Users, ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { getMeetingById, getMeetingInviteeCount } from "@/lib/data/meetings";
import {
  MeetingTypeBadge,
  MeetingStatusBadge,
  MeetingPriorityBadge,
} from "@/components/meetings/meeting-badge";
import { MeetingTime } from "@/components/meetings/meeting-time";
import { RsvpButtons } from "@/components/meetings/rsvp-buttons";
import { CancelMeetingButton } from "@/components/meetings/cancel-meeting-button";
import { MeetingStatusControls } from "@/components/meetings/meeting-status-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RsvpResponse, UserRole } from "@/types/database";

export const metadata: Metadata = { title: "تفاصيل الاجتماع — نسك" };

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "مدير النظام",
  track_manager: "رئيس فريق",
  team_member: "عضو الفريق",
};

function formatOrganizerRole(
  role: UserRole,
  teamName: string | null | undefined
): string {
  if (role === "track_manager" && teamName) {
    return `رئيس فريق ${teamName}`;
  }
  return ROLE_LABELS[role] ?? role;
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role, team_id")
    .eq("user_id", user.id)
    .single();
  if (!emp) return null;

  const meeting = await getMeetingById(meetingId);
  if (!meeting) notFound();

  const isOrganizer = meeting.organizer_id === emp.id || emp.role === "super_admin";
  const canCancel =
    isOrganizer &&
    meeting.status !== "cancelled" &&
    meeting.status !== "completed";
  const myRsvp = meeting.rsvps.find((r) => r.employee_id === emp.id);
  const canRsvp = meeting.status === "scheduled" || meeting.status === "in_progress";

  // RSVP counts
  const attending = meeting.rsvps.filter((r) => r.response === "attending").length;
  const maybe = meeting.rsvps.filter((r) => r.response === "maybe").length;
  const notAttending = meeting.rsvps.filter((r) => r.response === "not_attending").length;
  const totalResponded = meeting.rsvps.length;

  // Total invitees (for "No Response" count) — only compute for organizer
  const totalInvitees = isOrganizer ? await getMeetingInviteeCount(meeting) : 0;
  const noResponse = isOrganizer ? Math.max(0, totalInvitees - totalResponded) : 0;

  const organizerRoleLabel = meeting.organizer
    ? formatOrganizerRole(
        meeting.organizer.role,
        meeting.organizer.team?.name ?? null
      )
    : null;

  return (
    <>
      <PageHeader
        title={meeting.title}
        description={meeting.description ?? ""}
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الاجتماعات", href: "/dashboard/meetings" },
          { label: meeting.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main info ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Priority + Type + Status */}
              <div className="flex flex-wrap gap-2 items-center">
                <MeetingPriorityBadge priority={meeting.priority} />
                <MeetingTypeBadge type={meeting.meeting_type} />
                <MeetingStatusBadge displayStatus={meeting.status} />
              </div>

              {/* Time */}
              <div className="flex items-start gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <MeetingTime
                  startTime={meeting.start_time}
                  endTime={meeting.end_time}
                  className="text-foreground"
                />
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">المنظم:</span>
                <span className="font-medium">{meeting.organizer?.full_name ?? "—"}</span>
                {organizerRoleLabel && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    {organizerRoleLabel}
                  </span>
                )}
              </div>

              {/* Teams (cross_team) */}
              {meeting.meeting_type === "cross_team" && meeting.meeting_teams.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-muted-foreground">الفرق المشاركة:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {meeting.meeting_teams.map((mt) => (
                        <span
                          key={mt.team_id}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted"
                        >
                          {mt.team?.name ?? mt.team_id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Team (team meeting) */}
              {meeting.meeting_type === "team" && meeting.team && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">الفريق:</span>
                  <span
                    className="font-medium px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: meeting.team.color + "22",
                      color: meeting.team.color,
                    }}
                  >
                    {meeting.team.name}
                  </span>
                </div>
              )}

              {/* Location */}
              {meeting.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{meeting.location}</span>
                </div>
              )}

              {/* Link */}
              {meeting.meeting_link && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={meeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    انضم للاجتماع
                  </a>
                </div>
              )}

              {/* Description */}
              {meeting.description && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {meeting.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RSVP section */}
          {canRsvp && (
            <Card>
              <CardContent className="pt-6">
                <RsvpButtons
                  meetingId={meeting.id}
                  currentResponse={(myRsvp?.response as RsvpResponse) ?? null}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Organizer controls (Start / End / Cancel) */}
          {isOrganizer && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">إجراءات المنظم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <MeetingStatusControls
                  meetingId={meeting.id}
                  status={meeting.status}
                  organizerId={meeting.organizer_id}
                  currentEmployeeId={emp.id}
                  currentRole={emp.role as UserRole}
                />
                {canCancel && (
                  <CancelMeetingButton meetingId={meeting.id} />
                )}
              </CardContent>
            </Card>
          )}

          {/* RSVP summary */}
          {isOrganizer && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ردود الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 font-medium">سيحضر</span>
                    <span className="font-bold">{attending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-600 font-medium">ربما</span>
                    <span className="font-bold">{maybe}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600 font-medium">اعتذر</span>
                    <span className="font-bold">{notAttending}</span>
                  </div>
                  {totalInvitees > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">لم يرد</span>
                      <span className="font-bold text-muted-foreground">{noResponse}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>إجمالي المدعوين</span>
                    <span>{totalInvitees > 0 ? totalInvitees : totalResponded}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My RSVP (non-organizers) */}
          {!isOrganizer && myRsvp && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ردي</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {myRsvp.response === "attending" && "✅ سأحضر"}
                  {myRsvp.response === "maybe" && "🤔 ربما"}
                  {myRsvp.response === "not_attending" && "❌ اعتذرت"}
                </p>
              </CardContent>
            </Card>
          )}

          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/meetings">
              <ArrowLeft className="h-4 w-4 ms-1" />
              العودة للاجتماعات
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
