"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  MapPin,
  Building2,
  Package,
  AlertTriangle,
  FileX,
  Clock,
  User,
  CheckSquare,
  Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  DistributionRequest,
  DistributionRequestStatus,
  DistributionRequestType,
  DistributionPageData,
} from "@/types/distribution";
import {
  REQUEST_TYPE_CONFIG,
  REQUEST_STATUS_CONFIG,
  CENTER_CONFIG,
} from "@/types/distribution";
import { ProcessDialog } from "@/components/distribution/process-dialog";

// ── Type badge ──────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<DistributionRequestType, { color: string; bg: string; icon: React.ElementType }> = {
  new_batches:   { color: "hsl(152 60% 35%)", bg: "hsl(152 60% 35% / .10)", icon: Package },
  alert_late:    { color: "hsl(32 95% 44%)",  bg: "hsl(32 95% 44% / .10)",  icon: AlertTriangle },
  alert_no_auth: { color: "hsl(0 72% 51%)",   bg: "hsl(0 72% 51% / .10)",   icon: FileX },
};

function TypeBadge({ type }: { type: DistributionRequestType }) {
  const cfg = TYPE_COLORS[type];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {REQUEST_TYPE_CONFIG[type].shortLabel}
    </span>
  );
}

function StatusBadge({ status }: { status: DistributionRequestStatus }) {
  const cfg = REQUEST_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...cfg.bgStyle, ...cfg.textStyle }}
    >
      {cfg.label}
    </span>
  );
}

// ── Filters ────────────────────────────────────────────────────────────────

const STATUS_TABS: Array<{ value: DistributionRequestStatus | "all"; label: string }> = [
  { value: "all",       label: "الكل" },
  { value: "new",       label: "جديد" },
  { value: "received",  label: "تم الاستلام" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "reported",  label: "تم الإبلاغ" },
];

const COMPANY_TYPE_TABS: Array<{ value: "all" | "inside" | "outside"; label: string }> = [
  { value: "all",     label: "الكل" },
  { value: "inside",  label: "داخل" },
  { value: "outside", label: "خارج" },
];

// ── Format date/time ───────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main component ─────────────────────────────────────────────────────────

interface CorporateClientProps {
  data: DistributionPageData;
}

export function CorporateClient({ data }: CorporateClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<DistributionRequest[]>(data.requests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DistributionRequestStatus | "all">("all");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<"all" | "inside" | "outside">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRequests, setDialogRequests] = useState<DistributionRequest[]>([]);

  const canProcess = data.pageRole === "corporate" || data.pageRole === "admin";

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("corporate_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "distribution_requests" },
        () => { router.refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Sync requests when data changes (server refresh)
  useEffect(() => {
    setRequests(data.requests);
  }, [data.requests]);

  // Filtered list
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (search && !r.company_name.includes(search)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (companyTypeFilter !== "all" && r.company_type !== companyTypeFilter) return false;
      return true;
    });
  }, [requests, search, statusFilter, companyTypeFilter]);

  const selectedNewRequests = useMemo(() => {
    return filtered.filter((r) => selectedIds.has(r.id) && r.status === "new");
  }, [filtered, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openDialogFor(reqs: DistributionRequest[]) {
    setDialogRequests(reqs);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setSelectedIds(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الشركة..."
            className="ps-9 h-9 w-56 rounded-xl text-sm"
          />
        </div>

        {/* Company type filter */}
        <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          {COMPANY_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCompanyTypeFilter(tab.value)}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors", companyTypeFilter === tab.value ? "text-white" : "text-muted-foreground hover:bg-muted/50")}
              style={companyTypeFilter === tab.value ? { background: "hsl(var(--n-dark))" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all" ? requests.length : requests.filter(r => r.status === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                statusFilter === tab.value ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              style={statusFilter === tab.value ? { background: "hsl(var(--n-dark))" } : {}}
            >
              {tab.label}
              <span
                className={cn("rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", statusFilter === tab.value ? "bg-white/20" : "bg-foreground/10")}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batch action bar */}
      {canProcess && selectedNewRequests.length > 0 && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5 border"
          style={{ background: "hsl(var(--n-dark) / .05)", borderColor: "hsl(var(--n-dark) / .2)" }}
        >
          <span className="text-sm font-medium" style={{ color: "hsl(var(--n-dark))" }}>
            {selectedNewRequests.length} طلب محدد
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
              onClick={() => setSelectedIds(new Set())}
            >
              إلغاء التحديد
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 gap-1"
              style={{ background: "hsl(var(--n-dark))", color: "hsl(var(--n-ivory))" }}
              onClick={() => openDialogFor(selectedNewRequests)}
            >
              معالجة المحدد
            </Button>
          </div>
        </div>
      )}

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 text-center"
          style={{ borderColor: "hsl(var(--n-gold) / .3)" }}
        >
          <MapPin className="h-8 w-8 mb-3 opacity-30" style={{ color: "hsl(var(--n-gold))" }} />
          <p className="text-sm font-medium text-muted-foreground">لا توجد طلبات</p>
          <p className="text-xs text-muted-foreground/60 mt-1">لا توجد طلبات تطابق الفلاتر المحددة</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {filtered.map((req) => {
              const isSelected = selectedIds.has(req.id);
              const centerLabel = req.center ? CENTER_CONFIG[req.center as keyof typeof CENTER_CONFIG]?.label : null;

              return (
                <div
                  key={req.id}
                  className={cn("flex items-start gap-3 px-4 py-3 transition-colors", isSelected && "bg-muted/30")}
                >
                  {/* Checkbox (only for new status when can process) */}
                  {canProcess && req.status === "new" && (
                    <button
                      type="button"
                      className="mt-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => toggleSelect(req.id)}
                      aria-label="تحديد"
                    >
                      {isSelected
                        ? <CheckSquare className="h-4 w-4" style={{ color: "hsl(var(--n-dark))" }} />
                        : <Square className="h-4 w-4" />
                      }
                    </button>
                  )}
                  {canProcess && req.status !== "new" && (
                    <div className="mt-1 shrink-0 w-4" />
                  )}

                  {/* Main content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">{req.company_name}</span>
                      <span
                        className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                        style={req.company_type === "inside"
                          ? { background: "hsl(201 96% 32% / .1)", color: "hsl(201 96% 32%)" }
                          : { background: "hsl(270 60% 50% / .1)", color: "hsl(270 60% 50%)" }
                        }
                      >
                        {req.company_type === "inside" ? "داخل" : "خارج"}
                      </span>
                      <TypeBadge type={req.request_type} />
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      {centerLabel && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--n-gold))" }} />
                          {centerLabel}
                        </span>
                      )}
                      {!centerLabel && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 opacity-30" />
                          <span className="opacity-50">—</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 shrink-0" />
                        {req.created_by_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatDateTime(req.created_at)}
                      </span>
                      {req.processed_by_name && (
                        <span className="flex items-center gap-1 opacity-70">
                          <User className="h-3 w-3 shrink-0" />
                          {req.processed_by_name}
                          {req.processed_at && (
                            <> · {formatDateTime(req.processed_at)}</>
                          )}
                        </span>
                      )}
                      {req.delegate_name && (
                        <span className="flex items-center gap-1 opacity-70">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {req.delegate_name}
                          {req.delegate_phone && ` · ${req.delegate_phone}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Per-row action */}
                  {canProcess && req.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs h-7 px-3"
                      onClick={() => openDialogFor([req])}
                    >
                      معالجة
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Process dialog */}
      <ProcessDialog
        requests={dialogRequests}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
