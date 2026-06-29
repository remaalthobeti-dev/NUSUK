"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { approveRequestAction, rejectRequestAction } from "@/app/(dashboard)/dashboard/approvals/actions";
import { getRoleLabel } from "@/lib/utils";
import type { RegistrationRequest, Team, UserRole } from "@/types/database";

interface ApprovalsProps {
  requests: RegistrationRequest[];
  teams: Team[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function ApprovalsDashboard({ requests, teams }: ApprovalsProps) {
  const router = useRouter();
  const [approveTarget, setApproveTarget] = useState<RegistrationRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RegistrationRequest | null>(null);
  const [role, setRole] = useState<UserRole>("team_member");
  const [teamId, setTeamId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);

  async function handleApprove() {
    if (!approveTarget) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("requestId", approveTarget.id);
    fd.append("role", role);
    fd.append("teamId", teamId);
    fd.append("jobTitle", jobTitle);
    const result = await approveRequestAction(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setApproveTarget(null);
      setRole("team_member");
      setTeamId("");
      setJobTitle("");
      router.refresh();
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("requestId", rejectTarget.id);
    fd.append("reason", rejectReason);
    const result = await rejectRequestAction(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-2xl border p-4 text-start transition-all ${filter === s ? "ring-2 ring-primary bg-accent" : "bg-card hover:bg-accent/50"}`}
          >
            <p className="text-2xl font-bold">{requests.filter((r) => r.status === s).length}</p>
            <p className="text-sm text-muted-foreground">{STATUS_LABELS[s]}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "الكل" : STATUS_LABELS[f]}
            {f === "pending" && pendingCount > 0 && (
              <Badge className="ms-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات في هذه الفئة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="rounded-2xl border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold">
                {req.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{req.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(req.created_at).toLocaleDateString("ar-SA")}
                </p>
                {req.rejection_reason && (
                  <p className="text-xs text-destructive mt-0.5">سبب الرفض: {req.rejection_reason}</p>
                )}
              </div>
              <Badge variant={STATUS_VARIANTS[req.status]}>
                {STATUS_LABELS[req.status]}
              </Badge>
              {req.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setApproveTarget(req)}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    موافقة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectTarget(req)}
                    className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    رفض
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>الموافقة على طلب التسجيل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              الموافقة على طلب: <span className="font-medium text-foreground">{approveTarget?.full_name}</span>
            </p>
            <div className="space-y-1.5">
              <Label>الصلاحية</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">{getRoleLabel("team_member")}</SelectItem>
                  <SelectItem value="track_manager">{getRoleLabel("track_manager")}</SelectItem>
                  <SelectItem value="super_admin">{getRoleLabel("super_admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الفريق</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفريق (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المسمى الوظيفي</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="مثال: أخصائي علاقات عملاء"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveTarget(null)}>إلغاء</Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "جاري الحفظ..." : "تأكيد الموافقة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>رفض طلب التسجيل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              رفض طلب: <span className="font-medium text-foreground">{rejectTarget?.full_name}</span>
            </p>
            <div className="space-y-1.5">
              <Label>سبب الرفض (اختياري)</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب الرفض"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? "جاري الحفظ..." : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
