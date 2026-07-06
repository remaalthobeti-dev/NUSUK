import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Link2,
  CalendarDays,
  User,
  Users,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Clock,
  UserCircle2,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RsvpResponse, UserRole } from "@/types/database";

export const metadata: Metadata = { title: "تفاصيل الاجتماع — نسك" };

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:   "مدير النظام",
  track_manager: "رئيس فريق",
  team_member:   "عضو الفريق",
};

function formatOrganizerRole(role: UserRole, teamName: string | null | undefined): string {
  if (role === "track_manager" && teamName) return `رئيس فريق ${teamName}`;
  return ROLE_LABELS[role] ?? role;
}

function getDurationLabel(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} دقيقة`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`;
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
  if (!user) redirect("/login");

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role, team_id")
    .eq("user_id", user.id)
    .single();
  if (!emp) redirect("/login");

  const meeting = await getMeetingById(meetingId);
  if (!meeting) notFound();

  const isOrganizer = meeting.organizer_id === emp.id || emp.role === "super_admin";
  const canCancel =
    isOrganizer &&
    meeting.status !== "cancelled" &&
    meeting.status !== "completed";
  const myRsvp = meeting.rsvps.find((r) => r.employee_id === emp.id);
  const canRsvp = meeting.status === "scheduled" || meeting.status === "in_progress";

  const attending    = meeting.rsvps.filter((r) => r.response === "attending").length;
  const maybe        = meeting.rsvps.filter((r) => r.response === "maybe").length;
  const notAttending = meeting.rsvps.filter((r) => r.response === "not_attending").length;
  const totalResponded = meeting.rsvps.length;

  const totalInvitees = isOrganizer ? await getMeetingInviteeCount(meeting) : 0;
  const noResponse    = isOrganizer ? Math.max(0, totalInvitees - totalResponded) : 0;

  const organizerRoleLabel = meeting.organizer
    ? formatOrganizerRole(meeting.organizer.role, meeting.organizer.team?.name ?? null)
    : null;

  const duration = getDurationLabel(meeting.start_time, meeting.end_time);

  return (
    <>
      <PageHeader
        title={meeting.title}
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "الاجتماعات", href: "/dashboard/meetings" },
          { label: meeting.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hero info card */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            {/* Status color bar */}
            <div
              className={cn(
                "h-1 w-full",
                meeting.status === "in_progress" && "bg-emerald-500",
                meeting.status === "scheduled"   && "bg-blue-400",
                meeting.status === "completed"   && "bg-slate-300 dark:bg-slate-600",
                meeting.status === "cancelled"   && "bg-red-400"
              )}
            />

            <div className="p-5 space-y-4">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2 items-center">
                <MeetingStatusBadge displayStatus={meeting.status} />
                <MeetingTypeBadge type={meeting.meeting_type} />
                <MeetingPriorityBadge priority={meeting.priority} />
              </div>

              {/* Time + Duration */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    <MeetingTime startTime={meeting.start_time} endTime={meeting.end_time} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    مدة الاجتماع: {duration}
                  </p>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المنظم</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {meeting.organizer?.full_name ?? "—"}
                    </span>
                    {organizerRoleLabel && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        {organizerRoleLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Teams (cross_team) */}
              {meeting.meeting_type === "cross_team" && meeting.meeting_teams.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">الفرق المشاركة</p>
                    <div className="flex flex-wrap gap-1.5">
                      {meeting.meeting_teams.map((mt) => (
                        <span
                          key={mt.team_id}
                          className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border/50 font-medium"
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
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الفريق</p>
                    <span
                      className="inline-block mt-0.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: meeting.team.color + "22",
                        color: meeting.team.color,
                      }}
                    >
                      {meeting.team.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Location */}
              {meeting.location && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الموقع</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{meeting.location}</p>
                  </div>
                </div>
              )}

              {/* Link */}
              {meeting.meeting_link && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">رابط الاجتماع</p>
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline mt-0.5 block"
                    >
                      انضم للاجتماع ←
                    </a>
                  </div>
                </div>
              )}

              {/* Description */}
              {meeting.description && (
                <div className="pt-3 border-t border-dashed border-border/50">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">الوصف</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {meeting.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RSVP section */}
          {canRsvp && (
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                ردي على الاجتماع
              </p>
              <RsvpButtons
                meetingId={meeting.id}
                currentResponse={(myRsvp?.response as RsvpResponse) ?? null}
              />
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Organizer controls */}
          {isOrganizer && (
            <div className="rounded-2xl border bg-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                إجراءات المنظم
              </h3>
              <MeetingStatusControls
                meetingId={meeting.id}
                status={meeting.status}
                organizerId={meeting.organizer_id}
                currentEmployeeId={emp.id}
                currentRole={emp.role as UserRole}
              />
              {canCancel && <CancelMeetingButton meetingId={meeting.id} />}
            </div>
          )}

          {/* RSVP summary (organizer) */}
          {isOrganizer && (
            <div className="rounded-2xl border bg-card p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                ردود الحضور
              </h3>

              <div className="space-y-2.5">
                <RsvpRow
                  icon={CheckCircle2}
                  iconColor="text-emerald-500"
                  label="سيحضر"
                  count={attending}
                  color="text-emerald-700 dark:text-emerald-400"
                  barColor="bg-emerald-500"
                  total={totalInvitees || totalResponded}
                />
                <RsvpRow
                  icon={HelpCircle}
                  iconColor="text-amber-500"
                  label="ربما"
                  count={maybe}
                  color="text-amber-700 dark:text-amber-400"
                  barColor="bg-amber-400"
                  total={totalInvitees || totalResponded}
                />
                <RsvpRow
                  icon={XCircle}
                  iconColor="text-red-500"
                  label="اعتذر"
                  count={notAttending}
                  color="text-red-700 dark:text-red-400"
                  barColor="bg-red-400"
                  total={totalInvitees || totalResponded}
                />
                {totalInvitees > 0 && (
                  <RsvpRow
                    icon={UserCircle2}
                    iconColor="text-muted-foreground"
                    label="لم يرد"
                    count={noResponse}
                    color="text-muted-foreground"
                    barColor="bg-muted"
                    total={totalInvitees}
                  />
                )}
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>إجمالي المدعوين</span>
                <span className="font-bold tabular-nums">
                  {totalInvitees > 0 ? totalInvitees : totalResponded}
                </span>
              </div>
            </div>
          )}

          {/* My RSVP (non-organizers) */}
          {!isOrganizer && myRsvp && (
            <div className="rounded-2xl border bg-card p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                ردي
              </h3>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                  myRsvp.response === "attending"     && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
                  myRsvp.response === "maybe"         && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
                  myRsvp.response === "not_attending" && "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                )}
              >
                {myRsvp.response === "attending"     && <><CheckCircle2 className="h-4 w-4" /> سأحضر</>}
                {myRsvp.response === "maybe"         && <><HelpCircle className="h-4 w-4" /> ربما أحضر</>}
                {myRsvp.response === "not_attending" && <><XCircle className="h-4 w-4" /> اعتذرت</>}
              </div>
            </div>
          )}

          {/* Back button */}
          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <Link href="/dashboard/meetings">
              <ArrowLeft className="h-4 w-4" />
              العودة للاجتماعات
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── RSVP row with mini bar ───────────────────────────────────────────────────

function RsvpRow({
  icon: Icon,
  iconColor,
  label,
  count,
  color,
  barColor,
  total,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  count: number;
  color: string;
  barColor: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums text-foreground">{count}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
