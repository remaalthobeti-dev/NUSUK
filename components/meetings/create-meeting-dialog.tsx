"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  CalendarDays,
  MapPin,
  Link2,
  AlignLeft,
  Users,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createMeetingAction } from "@/app/(dashboard)/dashboard/meetings/actions";
import { PRIORITY_CONFIG } from "./meeting-badge";
import type { UserRole, Team, MeetingType, MeetingPriority } from "@/types/database";

interface CreateMeetingDialogProps {
  role: UserRole;
  employeeTeamId: string | null;
  teams: Team[];
}

const TYPE_OPTIONS: Array<{ value: MeetingType; label: string; desc: string; icon: React.ElementType }> = [
  { value: "team",         label: "اجتماع فريق",  desc: "أعضاء فريق واحد",   icon: Users },
  { value: "cross_team",   label: "متعدد الفرق",  desc: "فرق متعددة",         icon: Building2 },
  { value: "organization", label: "تنظيمي",        desc: "جميع الموظفين",      icon: Users },
];

const PRIORITY_OPTIONS: MeetingPriority[] = ["urgent", "high", "normal"];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function CreateMeetingDialog({ role, employeeTeamId, teams }: CreateMeetingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>("team");
  const [priority, setPriority] = useState<MeetingPriority>("normal");
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    employeeTeamId ? [employeeTeamId] : []
  );

  function toggleTeam(id: string) {
    if (role === "track_manager" && id === employeeTeamId) return;
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const title = (data.get("title") as string).trim();
    if (!title) return setError("العنوان مطلوب");

    const startTime = data.get("start_time") as string;
    const endTime = data.get("end_time") as string;
    if (!startTime || !endTime) return setError("يجب تحديد وقت البداية والنهاية");
    if (new Date(endTime) <= new Date(startTime))
      return setError("يجب أن ينتهي الاجتماع بعد بدايته");

    if (meetingType === "cross_team" && selectedTeams.length < 2)
      return setError("اختر فريقين على الأقل للاجتماع المتعدد");

    const teamId = data.get("team_id") as string | null;

    startTransition(async () => {
      const { error: serverError, id } = await createMeetingAction({
        title,
        description: (data.get("description") as string)?.trim() || undefined,
        meeting_type: meetingType,
        priority,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        location: (data.get("location") as string)?.trim() || undefined,
        meeting_link: (data.get("meeting_link") as string)?.trim() || undefined,
        team_id: meetingType === "team" ? (teamId ?? undefined) : undefined,
        cross_team_ids: meetingType === "cross_team" ? selectedTeams : undefined,
      });

      if (serverError) {
        setError(serverError);
      } else {
        setOpen(false);
        form.reset();
        setMeetingType("team");
        setPriority("normal");
        router.push(`/dashboard/meetings/${id}`);
      }
    });
  }

  function handleOpen(o: boolean) {
    if (!o) setError(null);
    setOpen(o);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5 shrink-0">
        <Plus className="h-4 w-4" />
        اجتماع جديد
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold">إنشاء اجتماع جديد</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {/* ─── الأساسيات ─── */}
            <SectionDivider label="الأساسيات" />

            <div className="space-y-3">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  العنوان <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="عنوان الاجتماع"
                  required
                  className="h-9 text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold flex items-center gap-1.5">
                  <AlignLeft className="h-3 w-3 text-muted-foreground" />
                  الوصف
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="جدول الأعمال أو وصف الاجتماع (اختياري)"
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            {/* ─── النوع والأولوية ─── */}
            <SectionDivider label="النوع والأولوية" />

            <div className="space-y-3">
              {/* Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">نوع الاجتماع <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = meetingType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setMeetingType(opt.value);
                          if (opt.value === "cross_team" && employeeTeamId) {
                            setSelectedTeams([employeeTeamId]);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl text-start border transition-all duration-150",
                          isActive
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 mb-1.5", isActive ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                        <div className="text-[10px] opacity-60 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">الأولوية <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                          priority === p
                            ? cn(cfg.className, "shadow-sm")
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── الفريق ─── */}
            {(meetingType === "team" || meetingType === "cross_team") && (
              <>
                <SectionDivider label="الفريق" />

                {meetingType === "team" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="team_id" className="text-xs font-semibold">
                      الفريق <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="team_id"
                      name="team_id"
                      defaultValue={employeeTeamId ?? ""}
                      disabled={role === "track_manager"}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">اختر فريقاً</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {meetingType === "cross_team" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      الفرق المشاركة <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-xl bg-muted/20">
                      {teams.map((t) => {
                        const isSelected = selectedTeams.includes(t.id);
                        const isOwn = t.id === employeeTeamId && role === "track_manager";
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTeam(t.id)}
                            disabled={isOwn}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-muted",
                              isOwn && "cursor-not-allowed opacity-80"
                            )}
                          >
                            {t.name}
                            {isOwn && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTeams.length < 2 && (
                      <p className="text-xs text-muted-foreground">اختر فريقين على الأقل</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ─── الوقت ─── */}
            <SectionDivider label="الوقت" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  وقت البداية <span className="text-destructive">*</span>
                </Label>
                <Input id="start_time" name="start_time" type="datetime-local" required className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  وقت النهاية <span className="text-destructive">*</span>
                </Label>
                <Input id="end_time" name="end_time" type="datetime-local" required className="h-9 text-sm" />
              </div>
            </div>

            {/* ─── الموقع ─── */}
            <SectionDivider label="الموقع" />

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  الموقع
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="قاعة الاجتماعات، الرياض…"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meeting_link" className="text-xs font-semibold flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  رابط الاجتماع
                </Label>
                <Input
                  id="meeting_link"
                  name="meeting_link"
                  type="url"
                  placeholder="https://…"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="flex-1">
                {isPending ? "جاري الإنشاء…" : "إنشاء الاجتماع"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
