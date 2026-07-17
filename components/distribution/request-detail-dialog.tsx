"use client";

import { useState } from "react";
import {
  Building2,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  Truck,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  markRequestReceived,
  markRequestDelivered,
} from "@/app/(dashboard)/dashboard/distribution/actions";
import type { DistributionRequest, DistributionPageRole } from "@/types/distribution";
import { REQUEST_STATUS_CONFIG } from "@/types/distribution";

interface Props {
  request: DistributionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageRole: DistributionPageRole;
  onUpdate: (id: string, patch: Partial<DistributionRequest>) => void;
}

type Step = "view" | "confirm-receive" | "confirm-deliver";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-muted-foreground/40 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
  pageRole,
  onUpdate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [delegateName, setDelegateName] = useState("");
  const [delegatePhone, setDelegatePhone] = useState("");
  const [step, setStep] = useState<Step>("view");

  if (!request) return null;

  const canAct = pageRole === "admin" || pageRole === "distribution";
  const showReceive = canAct && request.status === "new";
  const showDeliver = canAct && request.status === "received";

  function handleClose() {
    onOpenChange(false);
    setStep("view");
    setDelegateName("");
    setDelegatePhone("");
  }

  async function handleReceive() {
    setLoading(true);
    try {
      const result = await markRequestReceived([request!.id]);
      if (result.error) {
        toast.error(result.error);
      } else {
        const now = new Date().toISOString();
        onUpdate(request!.id, { status: "received", processed_at: now });
        toast.success("تم تسجيل الاستلام بنجاح");
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeliver() {
    setLoading(true);
    try {
      const result = await markRequestDelivered(
        [request!.id],
        delegateName.trim() || "—",
        delegatePhone.trim() || "—"
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        const now = new Date().toISOString();
        onUpdate(request!.id, {
          status: "delivered",
          processed_at: now,
          delegate_name: delegateName.trim() || null,
          delegate_phone: delegatePhone.trim() || null,
        });
        toast.success("تم تسجيل التوصيل بنجاح");
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  }

  const statusCfg = REQUEST_STATUS_CONFIG[request.status];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Status pill */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الحالة الحالية</span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ ...statusCfg.bgStyle, ...statusCfg.textStyle }}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Info card */}
          <div
            className="rounded-xl divide-y overflow-hidden"
            style={{
              background: "hsl(var(--n-gold) / .04)",
              border: "1px solid hsl(var(--n-gold) / .12)",
            }}
          >
            <InfoRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="اسم الشركة"
              value={request.company_name}
            />
            <InfoRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="نوع الشركة"
              value={request.company_type === "inside" ? "داخل" : "خارج"}
            />
            <InfoRow
              icon={<User className="h-3.5 w-3.5" />}
              label="منشئ الطلب"
              value={request.created_by_name}
            />
            <InfoRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="تاريخ الإنشاء"
              value={formatDate(request.created_at)}
            />
            {request.notes && (
              <InfoRow
                icon={<FileText className="h-3.5 w-3.5" />}
                label="الملاحظات"
                value={request.notes}
              />
            )}
          </div>

          {/* ── Action: Receive ─────────────────────────────────────── */}
          {showReceive && step === "view" && (
            <Button
              className="w-full gap-2"
              onClick={() => setStep("confirm-receive")}
              style={{ background: "hsl(142 71% 35%)", color: "white" }}
            >
              <CheckCircle2 className="h-4 w-4" />
              استلام
            </Button>
          )}

          {showReceive && step === "confirm-receive" && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "hsl(142 71% 35% / .08)",
                border: "1px solid hsl(142 71% 35% / .2)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "hsl(142 71% 35%)" }}>
                تأكيد الاستلام
              </p>
              <p className="text-xs text-muted-foreground">
                سيتم تسجيل وقت الاستلام باسمك الآن. هل تريد المتابعة؟
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep("view")}
                  disabled={loading}
                >
                  رجوع
                </Button>
                <Button
                  size="sm"
                  onClick={handleReceive}
                  disabled={loading}
                  className="gap-1.5"
                  style={{ background: "hsl(142 71% 35%)", color: "white" }}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  تم الاستلام
                </Button>
              </div>
            </div>
          )}

          {/* ── Action: Deliver ─────────────────────────────────────── */}
          {showDeliver && step === "view" && (
            <Button
              className="w-full gap-2"
              onClick={() => setStep("confirm-deliver")}
              style={{ background: "hsl(201 96% 32%)", color: "white" }}
            >
              <Truck className="h-4 w-4" />
              التوصيل
            </Button>
          )}

          {showDeliver && step === "confirm-deliver" && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "hsl(201 96% 32% / .08)",
                border: "1px solid hsl(201 96% 32% / .2)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "hsl(201 96% 32%)" }}>
                تأكيد التوصيل
              </p>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">اسم المفوض (اختياري)</Label>
                  <Input
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    placeholder="أدخل اسم المفوض"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">رقم جوال المفوض (اختياري)</Label>
                  <Input
                    value={delegatePhone}
                    onChange={(e) => setDelegatePhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep("view")}
                  disabled={loading}
                >
                  رجوع
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeliver}
                  disabled={loading}
                  className="gap-1.5"
                  style={{ background: "hsl(201 96% 32%)", color: "white" }}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Truck className="h-3.5 w-3.5" />
                  )}
                  تم التوصيل
                </Button>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
