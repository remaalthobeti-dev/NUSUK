"use client";

import { useState } from "react";
import { Send, Package, AlertTriangle, FileX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createDistributionRequests } from "@/app/(dashboard)/dashboard/distribution/actions";
import type { DistributionRequestType } from "@/types/distribution";
import { REQUEST_TYPE_CONFIG } from "@/types/distribution";

interface SendPanelProps {
  selectedIds: Set<string>;
  onSuccess: () => void;
}

const TYPES: Array<{
  type: DistributionRequestType;
  icon: React.ElementType;
  accentStyle: React.CSSProperties;
  activeBg: React.CSSProperties;
}> = [
  {
    type: "new_batches",
    icon: Package,
    accentStyle: { color: "hsl(201 96% 32%)" },
    activeBg: { background: "hsl(201 96% 32% / .1)", borderColor: "hsl(201 96% 32% / .3)" },
  },
  {
    type: "alert_late",
    icon: AlertTriangle,
    accentStyle: { color: "hsl(38 92% 50%)" },
    activeBg: { background: "hsl(38 92% 50% / .1)", borderColor: "hsl(38 92% 50% / .3)" },
  },
  {
    type: "alert_no_auth",
    icon: FileX,
    accentStyle: { color: "hsl(0 84% 60%)" },
    activeBg: { background: "hsl(0 84% 60% / .1)", borderColor: "hsl(0 84% 60% / .3)" },
  },
];

export function SendPanel({ selectedIds, onSuccess }: SendPanelProps) {
  const [requestType, setRequestType] = useState<DistributionRequestType | null>(null);
  const [loading, setLoading] = useState(false);

  const canSend = selectedIds.size > 0 && requestType !== null;

  async function handleSend() {
    if (!canSend) return;
    setLoading(true);
    try {
      const result = await createDistributionRequests(
        Array.from(selectedIds),
        requestType!
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `تم إرسال ${result.count} طلب إلى فريق علاقات الشركات بنجاح`
        );
        setRequestType(null);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4"
      style={{ borderColor: "hsl(var(--border))" }}>
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4" style={{ color: "hsl(var(--n-gold))" }} />
        <h2 className="text-sm font-bold text-foreground">حدد نوع الإجراء</h2>
      </div>

      {/* Action type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TYPES.map(({ type, icon: Icon, accentStyle, activeBg }) => {
          const isActive = requestType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setRequestType(isActive ? null : type)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition-all duration-150",
                isActive
                  ? "shadow-sm"
                  : "border-border hover:bg-muted/40"
              )}
              style={isActive ? activeBg : {}}
            >
              <Icon
                className="h-5 w-5 shrink-0"
                style={isActive ? accentStyle : { color: "hsl(var(--muted-foreground))" }}
              />
              <div>
                <p
                  className={cn(
                    "text-xs font-semibold leading-snug",
                    isActive ? "" : "text-foreground/70"
                  )}
                  style={isActive ? accentStyle : {}}
                >
                  {REQUEST_TYPE_CONFIG[type].label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit row */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-sm text-muted-foreground">
          {selectedIds.size === 0 ? (
            <span>لم يتم تحديد أي شركة بعد</span>
          ) : (
            <span>
              تم تحديد{" "}
              <span className="font-bold" style={{ color: "hsl(var(--n-gold))" }}>
                {selectedIds.size}
              </span>{" "}
              شركة
            </span>
          )}
        </div>

        <Button
          disabled={!canSend || loading}
          onClick={handleSend}
          className="gap-2 text-sm"
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
            <Send className="h-4 w-4" />
          )}
          إرسال إلى فريق علاقات الشركات
        </Button>
      </div>
    </div>
  );
}
