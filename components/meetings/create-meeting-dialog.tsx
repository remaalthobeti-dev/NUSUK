"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMeetingAction } from "@/app/(dashboard)/dashboard/meetings/actions";
import { PRIORITY_CONFIG } from "./meeting-badge";
import type { UserRole, Team, MeetingType, MeetingPriority } from "@/types/database";

interface CreateMeetingDialogProps {
  role: UserRole;
  employeeTeamId: string | null;
  teams: Team[];
}

const TYPE_OPTIONS: Array<{ value: MeetingType; label: string; desc: string }> = [
  { value: "team", label: "اجتماع فريق", desc: "أعضاء فريق واحد" },
  { value: "cross_team", label: "متعدد الفرق", desc: "فرق متعددة" },
  { value: "organization", label: "تنظيمي", desc: "جميع الموظفين" },
];

const PRIORITY_OPTIONS: MeetingPriority[] = ["urgent", "high", "normal"];

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
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 me-1" />
        اجتماع جديد
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء اجتماع جديد</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">العنوان *</Label>
              <Input id="title" name="title" placeholder="عنوان الاجتماع" required />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="وصف الاجتماع (اختياري)"
                rows={2}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>نوع الاجتماع *</Label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setMeetingType(opt.value);
                      if (opt.value === "cross_team" && employeeTeamId) {
                        setSelectedTeams([employeeTeamId]);
                      }
                    }}
                    className={`p-2.5 rounded-lg text-xs font-medium border transition-all text-right ${
                      meetingType === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="font-semibold mb-0.5">{opt.label}</div>
                    <div className="opacity-70 text-[10px]">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>الأولوية *</Label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        priority === p
                          ? cfg.className + " shadow-sm"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team selector — team meetings */}
            {meetingType === "team" && (
              <div className="space-y-1.5">
                <Label htmlFor="team_id">الفريق *</Label>
                <select
                  id="team_id"
                  name="team_id"
                  defaultValue={employeeTeamId ?? ""}
                  disabled={role === "track_manager"}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">اختر فريقاً</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Team multi-select — cross_team */}
            {meetingType === "cross_team" && (
              <div className="space-y-1.5">
                <Label>الفرق المشاركة *</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                  {teams.map((t) => {
                    const isSelected = selectedTeams.includes(t.id);
                    const isOwn = t.id === employeeTeamId && role === "track_manager";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeam(t.id)}
                        disabled={isOwn}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-accent"
                        } disabled:cursor-not-allowed`}
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

            {/* Start / End time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">وقت البداية *</Label>
                <Input id="start_time" name="start_time" type="datetime-local" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">وقت النهاية *</Label>
                <Input id="end_time" name="end_time" type="datetime-local" required />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                name="location"
                placeholder="قاعة الاجتماعات، الرياض…"
              />
            </div>

            {/* Link */}
            <div className="space-y-1.5">
              <Label htmlFor="meeting_link">رابط الاجتماع</Label>
              <Input id="meeting_link" name="meeting_link" type="url" placeholder="https://…" />
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جاري الإنشاء…" : "إنشاء الاجتماع"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
