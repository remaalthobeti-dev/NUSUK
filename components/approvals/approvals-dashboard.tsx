"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Clock,
  Search,
  UserCheck,
  UserX,
  Users,
  ChevronDown,
  AlertCircle,
  CalendarDays,
  Mail,
  Shield,
  Building2,
  Briefcase,
  RotateCcw,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { approveRequestAction, rejectRequestAction } from "@/app/(dashboard)/dashboard/approvals/actions";
import { getRoleLabel } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import type { RegistrationRequest, Team, UserRole } from "@/types/database";

interface ApprovalsProps {
  requests: RegistrationRequest[];
  teams: Team[];
}

// ─── Config ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "بانتظار الموافقة",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    borderClass: "border-s-amber-400",
    icon: Clock,
    dotClass: "bg-amber-400",
  },
  approved: {
    label: "تمت الموافقة",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    borderClass: "border-s-emerald-500",
    icon: UserCheck,
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "مرفوض",
    badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    borderClass: "border-s-red-400",
    icon: UserX,
    dotClass: "bg-red-400",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;
type SortKey = "newest" | "oldest" | "name";

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `منذ ${m || 1} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 7) return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(name: string): string {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");
}

// ─── Sub-components ─────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      cfg.badgeClass
    )}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function StatCard({
  count, label, status, active, onClick,
}: {
  count: number; label: string; status: StatusKey; active: boolean; onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-start transition-all duration-200 group",
        active
          ? "ring-2 ring-primary/30 bg-primary/5 border-primary/20"
          : "bg-card hover:bg-muted/40 hover:border-border/80"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
          status === "pending" ? "bg-amber-100 dark:bg-amber-950/50" :
          status === "approved" ? "bg-emerald-100 dark:bg-emerald-950/50" :
          "bg-red-100 dark:bg-red-950/50"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            status === "pending" ? "text-amber-600 dark:text-amber-400" :
            status === "approved" ? "text-emerald-600 dark:text-emerald-400" :
            "text-red-500 dark:text-red-400"
          )} />
        </div>
        {status === "pending" && count > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </button>
  );
}

function RequestCard({
  req,
  onApprove,
  onReject,
}: {
  req: RegistrationRequest;
  onApprove: (r: RegistrationRequest) => void;
  onReject: (r: RegistrationRequest) => void;
}) {
  const cfg = STATUS_CONFIG[req.status as StatusKey] ?? STATUS_CONFIG.pending;
  const isPending = req.status === "pending";
  const isOld = isPending && (Date.now() - new Date(req.created_at).getTime()) > 48 * 60 * 60 * 1000;

  return (
    <div className={cn(
      "rounded-2xl border bg-card border-s-[3px] transition-all duration-200 hover:shadow-sm",
      cfg.borderClass,
      isOld && "ring-1 ring-amber-200 dark:ring-amber-800/50"
    )}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {initials(req.full_name)}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{req.full_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{req.email}</span>
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(req.created_at)}
              </span>
              <span className="text-[11px] text-muted-foreground">{timeAgo(req.created_at)}</span>
              {isOld && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  بانتظار أكثر من 48 ساعة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Approved details */}
        {req.status === "approved" && (req.approved_role || req.approved_team_id || req.approved_title) && (
          <div className="mt-3 pt-3 border-t border-dashed flex flex-wrap gap-2">
            {req.approved_role && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                <Shield className="h-3 w-3" />
                {getRoleLabel(req.approved_role)}
              </span>
            )}
            {req.approved_title && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                <Briefcase className="h-3 w-3" />
                {req.approved_title}
              </span>
            )}
            {req.reviewed_at && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                <CalendarDays className="h-3 w-3" />
                اعتمد {timeAgo(req.reviewed_at)}
              </span>
            )}
          </div>
        )}

        {/* Rejection reason */}
        {req.status === "rejected" && req.rejection_reason && (
          <div className="mt-3 pt-3 border-t border-dashed">
            <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
              <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span><span className="font-medium">سبب الرفض: </span>{req.rejection_reason}</span>
            </p>
            {req.reviewed_at && (
              <p className="text-[11px] text-muted-foreground mt-1 ms-5">رُفض {timeAgo(req.reviewed_at)}</p>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      {isPending && (
        <div className="px-4 pb-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => onApprove(req)}
            className="flex-1 gap-1.5 h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            <Check className="h-3.5 w-3.5" />
            موافقة
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(req)}
            className="flex-1 gap-1.5 h-8 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            <X className="h-3.5 w-3.5" />
            رفض
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Timeline entry ─────────────────────────────────────────────────────────

function TimelineEntry({ icon: Icon, label, value, time, colorClass }: {
  icon: React.ElementType; label: string; value: string; time?: string | null; colorClass: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
        {time && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{formatDateTime(time)}</p>}
      </div>
    </div>
  );
}

// ─── Approve Dialog ──────────────────────────────────────────────────────────

function ApproveDialog({
  target, teams, onClose, onDone,
}: {
  target: RegistrationRequest | null;
  teams: Team[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [role, setRole] = useState<UserRole>("team_member");
  const [teamId, setTeamId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!target) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("requestId", target.id);
    fd.append("role", role);
    fd.append("teamId", teamId);
    fd.append("jobTitle", jobTitle);
    const result = await approveRequestAction(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setRole("team_member");
      setTeamId("");
      setJobTitle("");
      onDone();
    }
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Dialog open={!!target} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            الموافقة على طلب التسجيل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Requester info */}
          {target && (
            <div className="rounded-xl bg-muted/40 border p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {initials(target.full_name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{target.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{target.email}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  قدّم الطلب {timeAgo(target.created_at)}
                </p>
              </div>
            </div>
          )}

          <SectionDivider label="إعدادات الحساب" />

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-muted-foreground" />
              الصلاحية <span className="text-destructive">*</span>
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">{getRoleLabel("team_member")}</SelectItem>
                <SelectItem value="track_manager">{getRoleLabel("track_manager")}</SelectItem>
                <SelectItem value="super_admin">{getRoleLabel("super_admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              الفريق
            </Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="اختر الفريق (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 text-muted-foreground" />
              المسمى الوظيفي
            </Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="مثال: أخصائي علاقات عملاء"
              className="h-9 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1 border-t">
            <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              {loading ? "جاري الحفظ…" : "تأكيد الموافقة"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Dialog ───────────────────────────────────────────────────────────

function RejectDialog({
  target, onClose, onDone,
}: {
  target: RegistrationRequest | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReject() {
    if (!target) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("requestId", target.id);
    fd.append("reason", reason);
    const result = await rejectRequestAction(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setReason("");
      onDone();
    }
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Dialog open={!!target} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <UserX className="h-4 w-4 text-red-500 dark:text-red-400" />
            </div>
            رفض طلب التسجيل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {target && (
            <div className="rounded-xl bg-muted/40 border p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {initials(target.full_name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{target.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{target.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">سبب الرفض (اختياري)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="أدخل سبب الرفض لإبلاغ المتقدم…"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              سيتم رفض الطلب وإشعار المتقدم بالقرار.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
              إلغاء
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "جاري الحفظ…" : "تأكيد الرفض"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ApprovalsDashboard({ requests, teams }: ApprovalsProps) {
  const router = useRouter();
  const [approveTarget, setApproveTarget] = useState<RegistrationRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RegistrationRequest | null>(null);
  const [activeStatus, setActiveStatus] = useState<StatusKey | "all">("pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);

  const filtered = useMemo(() => {
    let list = activeStatus === "all" ? requests : requests.filter((r) => r.status === activeStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return a.full_name.localeCompare(b.full_name, "ar");
    });
  }, [requests, activeStatus, search, sort]);

  function handleDone() {
    setApproveTarget(null);
    setRejectTarget(null);
    router.refresh();
  }

  const urgentCount = requests.filter(
    (r) => r.status === "pending" && (Date.now() - new Date(r.created_at).getTime()) > 48 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-5">

      {/* ─── KPI cards ─── */}
      <div className="grid grid-cols-3 gap-3">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <StatCard
            key={s}
            count={counts[s]}
            label={STATUS_CONFIG[s].label}
            status={s}
            active={activeStatus === s}
            onClick={() => setActiveStatus(activeStatus === s ? "all" : s)}
          />
        ))}
      </div>

      {/* ─── Urgent alert ─── */}
      {urgentCount > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{urgentCount} طلب</span> بانتظار المراجعة لأكثر من 48 ساعة
          </p>
        </div>
      )}

      {/* ─── Search + filters ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث بالاسم أو البريد…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center rounded-xl border bg-card p-1 gap-0.5">
          {([
            { key: "all", label: "الكل", count: requests.length },
            { key: "pending", label: "انتظار", count: counts.pending },
            { key: "approved", label: "معتمد", count: counts.approved },
            { key: "rejected", label: "مرفوض", count: counts.rejected },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveStatus(key)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                activeStatus === key
                  ? "bg-background shadow-sm border text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold transition-colors",
                activeStatus === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-9 w-36 text-xs gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">الأحدث أولاً</SelectItem>
            <SelectItem value="oldest">الأقدم أولاً</SelectItem>
            <SelectItem value="name">الاسم أبجدياً</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Results header ─── */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-4 rounded-full bg-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {activeStatus === "all" ? "جميع الطلبات" : STATUS_CONFIG[activeStatus as StatusKey]?.label}
        </span>
        <span className="text-xs text-muted-foreground">({filtered.length})</span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="ms-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" />
            مسح البحث
          </button>
        )}
      </div>

      {/* ─── List ─── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="لا توجد طلبات"
          description={search ? "جرّب البحث بكلمات مختلفة" : "جميع الطلبات تمت معالجتها"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {/* ─── Dialogs ─── */}
      <ApproveDialog
        target={approveTarget}
        teams={teams}
        onClose={() => setApproveTarget(null)}
        onDone={handleDone}
      />
      <RejectDialog
        target={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onDone={handleDone}
      />
    </div>
  );
}
