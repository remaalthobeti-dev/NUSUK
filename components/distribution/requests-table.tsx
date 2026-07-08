"use client";

import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Clock,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DistributionRequest,
  DistributionRequestStatus,
  DistributionRequestType,
  DistributionPageRole,
} from "@/types/distribution";
import {
  REQUEST_TYPE_CONFIG,
  REQUEST_STATUS_CONFIG,
} from "@/types/distribution";
import { ProcessDialog } from "./process-dialog";

interface RequestsTableProps {
  requests: DistributionRequest[];
  pageRole: DistributionPageRole;
  onRefresh: () => void;
}

const STATUS_FILTERS: Array<{ value: DistributionRequestStatus | "all"; label: string }> = [
  { value: "all", label: "الكل" },
  { value: "new", label: "جديد" },
  { value: "received", label: "تم الاستلام" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "reported", label: "تم الإبلاغ" },
];

const TYPE_FILTERS: Array<{ value: DistributionRequestType | "all"; label: string }> = [
  { value: "all", label: "جميع الأنواع" },
  { value: "new_batches", label: "دفعات جديدة" },
  { value: "alert_late", label: "دفعات متأخرة" },
  { value: "alert_no_auth", label: "لا تفويض" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }: { type: DistributionRequestType }) {
  const cfg = REQUEST_TYPE_CONFIG[type];
  const colorMap = {
    blue: { bg: "hsl(201 96% 32% / .1)", text: "hsl(201 96% 32%)" },
    amber: { bg: "hsl(38 92% 50% / .1)", text: "hsl(38 82% 40%)" },
    red: { bg: "hsl(0 84% 60% / .1)", text: "hsl(0 70% 50%)" },
  } as const;
  const color = colorMap[cfg.alertColor as keyof typeof colorMap];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ background: color.bg, color: color.text }}
    >
      {cfg.shortLabel}
    </span>
  );
}

function StatusBadge({ status }: { status: DistributionRequestStatus }) {
  const cfg = REQUEST_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ ...cfg.bgStyle, ...cfg.textStyle }}
    >
      {cfg.label}
    </span>
  );
}

export function RequestsTable({ requests, pageRole, onRefresh }: RequestsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DistributionRequestStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DistributionRequestType | "all">("all");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<"all" | "inside" | "outside">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (search && !r.company_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.request_type !== typeFilter) return false;
      if (companyTypeFilter !== "all" && r.company_type !== companyTypeFilter) return false;
      return true;
    });
  }, [requests, search, statusFilter, typeFilter, companyTypeFilter]);

  const selectedRequests = useMemo(
    () => filtered.filter((r) => selectedIds.has(r.id)),
    [filtered, selectedIds]
  );

  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const canProcess = pageRole === "corporate" || pageRole === "admin";

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  }

  const processableSelected = selectedRequests.filter((r) => r.status === "new");

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            placeholder="بحث باسم الشركة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-8 h-9"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value as DistributionRequestStatus | "all")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                statusFilter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Company type filter */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {(["all", "inside", "outside"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCompanyTypeFilter(v)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                companyTypeFilter === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "all" ? "داخل + خارج" : v === "inside" ? "الداخل" : "الخارج"}
            </button>
          ))}
        </div>
      </div>

      {/* Batch action bar */}
      {canProcess && processableSelected.length > 0 && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm"
          style={{ background: "hsl(var(--n-gold) / .08)", border: "1px solid hsl(var(--n-gold) / .2)" }}
        >
          <span className="font-medium" style={{ color: "hsl(var(--n-ink-2))" }}>
            {processableSelected.length} طلب محدد قابل للمعالجة
          </span>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            style={{ background: "hsl(var(--n-dark))", color: "hsl(var(--n-ivory))" }}
          >
            معالجة المحدد
          </Button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-12 text-center flex flex-col items-center gap-3"
          style={{ borderColor: "hsl(var(--n-gold) / .18)", background: "hsl(var(--n-gold) / .02)" }}
        >
          <SlidersHorizontal className="h-8 w-8 opacity-20" style={{ color: "hsl(var(--n-gold))" }} />
          <p className="text-sm font-medium text-muted-foreground">
            {search || statusFilter !== "all" || typeFilter !== "all"
              ? "لا توجد نتائج تطابق الفلاتر"
              : "لا توجد طلبات بعد"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "hsl(var(--muted) / .3)" }}>
                  {canProcess && (
                    <th className="px-4 py-3 text-start w-10">
                      <button type="button" onClick={toggleAll}>
                        {allSelected ? (
                          <CheckSquare className="h-4 w-4" style={{ color: "hsl(var(--n-gold))" }} />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    الشركة
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    النوع
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    الطلب
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    مُنشئ الطلب
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    وقت الإنشاء
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    مُعالج بواسطة
                  </th>
                  {processableSelected.some((r) => r.delegate_name) && (
                    <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      المفوض
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => {
                  const isSelected = selectedIds.has(req.id);
                  return (
                    <tr
                      key={req.id}
                      className="border-t transition-colors duration-100 hover:bg-muted/30"
                      style={isSelected ? { background: "hsl(var(--n-gold) / .05)" } : {}}
                    >
                      {canProcess && (
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleRow(req.id)}>
                            {isSelected ? (
                              <CheckSquare
                                className="h-4 w-4"
                                style={{ color: "hsl(var(--n-gold))" }}
                              />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground leading-snug">
                            {req.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.company_type === "inside" ? "داخل" : "خارج"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {req.company_type === "inside" ? "شركات الداخل" : "شركات الخارج"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={req.request_type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className="text-sm text-foreground/80 truncate max-w-32">
                            {req.created_by_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(req.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {req.processed_by_name ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                              <span className="text-sm text-foreground/80 truncate max-w-32">
                                {req.processed_by_name}
                              </span>
                            </div>
                            {req.processed_at && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDate(req.processed_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                      {req.delegate_name && (
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{req.delegate_name}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">
                              {req.delegate_phone}
                            </p>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div
            className="px-4 py-2.5 border-t flex items-center justify-between"
            style={{ background: "hsl(var(--muted) / .2)" }}
          >
            <p className="text-xs text-muted-foreground">
              {filtered.length} طلب
              {filtered.length !== requests.length && ` من ${requests.length}`}
            </p>
            {selectedIds.size > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSelectedIds(new Set())}
              >
                إلغاء التحديد
              </button>
            )}
          </div>
        </div>
      )}

      {/* Process dialog */}
      <ProcessDialog
        requests={processableSelected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setSelectedIds(new Set());
          onRefresh();
        }}
      />
    </div>
  );
}
