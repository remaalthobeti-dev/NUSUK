"use client";

import { useState } from "react";
import {
  Send, Package, AlertTriangle, FileX, Loader2,
  MapPin, Building2, X, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createDistributionRequests } from "@/app/(dashboard)/dashboard/distribution/actions";
import type { DistributionRequestType, DistributionCompany } from "@/types/distribution";
import { REQUEST_TYPE_CONFIG } from "@/types/distribution";
import type { DistributionCenter } from "./company-selector";

const CENTER_LABELS: Record<DistributionCenter, string> = {
  mecca:  "مركز توزيع مكة",
  medina: "مركز توزيع المدينة",
};

const ACTION_TYPES: Array<{
  type: DistributionRequestType;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = [
  {
    type:   "new_batches",
    icon:   Package,
    color:  "hsl(152 60% 35%)",
    bg:     "hsl(152 60% 35% / .08)",
    border: "hsl(152 60% 35% / .25)",
    dot:    "hsl(152 60% 40%)",
  },
  {
    type:   "alert_late",
    icon:   AlertTriangle,
    color:  "hsl(32 95% 44%)",
    bg:     "hsl(32 95% 44% / .08)",
    border: "hsl(32 95% 44% / .25)",
    dot:    "hsl(32 95% 44%)",
  },
  {
    type:   "alert_no_auth",
    icon:   FileX,
    color:  "hsl(0 72% 51%)",
    bg:     "hsl(0 72% 51% / .08)",
    border: "hsl(0 72% 51% / .25)",
    dot:    "hsl(0 72% 51%)",
  },
];

interface ActionSidePanelProps {
  center: DistributionCenter | null;
  activeType: "inside" | "outside";
  selectedIds: Set<string>;
  companies: DistributionCompany[];
  onSuccess: () => void;
  onClearSelection: () => void;
}

export function ActionSidePanel({
  center,
  activeType,
  selectedIds,
  companies,
  onSuccess,
  onClearSelection,
}: ActionSidePanelProps) {
  const [requestType, setRequestType] = useState<DistributionRequestType | null>(null);
  const [loading, setLoading] = useState(false);

  const visible = selectedIds.size > 0 && center !== null;

  const selectedCompanies = companies.filter((c) => selectedIds.has(c.id));
  const canSend = visible && requestType !== null;

  async function handleSend() {
    if (!canSend) return;
    setLoading(true);
    try {
      const result = await createDistributionRequests(
        Array.from(selectedIds),
        requestType!,
        center!
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`تم إرسال ${result.count} طلب بنجاح`);
        setRequestType(null);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 end-0 z-50 w-80 flex flex-col bg-card border-s shadow-2xl",
        "transition-all duration-300 ease-in-out",
        visible
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-full opacity-0 pointer-events-none"
      )}
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{
          borderColor: "hsl(var(--border))",
          background: "hsl(var(--n-dark))",
        }}
      >
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4" style={{ color: "hsl(var(--n-gold))" }} />
          <span className="text-sm font-bold" style={{ color: "hsl(var(--n-ivory))" }}>
            تنفيذ إجراء
          </span>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(250,250,247,0.5)" }}
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Context info */}
        <div className="space-y-2">
          {center && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--n-gold))" }} />
              <span className="font-medium">{CENTER_LABELS[center]}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--n-gold))" }} />
            <span className="font-medium">
              {activeType === "inside" ? "شركات الداخل" : "شركات الخارج"}
            </span>
          </div>
        </div>

        {/* Selected companies */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">
              الشركات المحددة
            </span>
            <span
              className="text-xs font-bold rounded-full px-2 py-0.5 text-white tabular-nums"
              style={{ background: "hsl(var(--n-gold))" }}
            >
              {selectedIds.size}
            </span>
          </div>
          <div className="rounded-xl border max-h-44 overflow-y-auto"
            style={{ borderColor: "hsl(var(--border))" }}>
            {selectedCompanies.map((c, i) => (
              <div
                key={c.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs",
                  i < selectedCompanies.length - 1 && "border-b"
                )}
                style={i < selectedCompanies.length - 1
                  ? { borderColor: "hsl(var(--border))" }
                  : {}}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: "hsl(var(--n-gold))" }}
                />
                <span className="truncate text-foreground/80">{c.name}</span>
              </div>
            ))}
          </div>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="mt-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              إلغاء التحديد
            </button>
          )}
        </div>

        {/* Action type */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">نوع الإجراء</p>
          <div className="space-y-2">
            {ACTION_TYPES.map(({ type, icon: Icon, color, bg, border, dot }) => {
              const active = requestType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRequestType(active ? null : type)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-start",
                    "transition-all duration-150",
                    active ? "shadow-sm" : "border-border hover:bg-muted/30"
                  )}
                  style={active ? { background: bg, borderColor: border } : {}}
                >
                  {/* Dot indicator */}
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0 transition-all duration-150",
                      active ? "scale-125" : "opacity-40"
                    )}
                    style={{ background: dot }}
                  />
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: active ? color : "hsl(var(--muted-foreground))" }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: active ? color : "hsl(var(--foreground)/0.7)" }}
                  >
                    {REQUEST_TYPE_CONFIG[type].label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Send button */}
      <div
        className="p-4 border-t shrink-0"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <Button
          className="w-full gap-2 text-sm font-bold h-10"
          disabled={!canSend || loading}
          onClick={handleSend}
          style={
            canSend
              ? {
                  background: "hsl(var(--n-dark))",
                  color: "hsl(var(--n-ivory))",
                }
              : {}
          }
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              إرسال إلى فريق علاقات الشركات
              <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180 opacity-60" />
            </>
          )}
        </Button>

        {!requestType && selectedIds.size > 0 && (
          <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
            اختر نوع الإجراء أولاً
          </p>
        )}
      </div>
    </div>
  );
}
