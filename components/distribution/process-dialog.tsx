"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Truck, Bell } from "lucide-react";
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
  markRequestReported,
} from "@/app/(dashboard)/dashboard/distribution/actions";
import type { DistributionRequest } from "@/types/distribution";
import { REQUEST_TYPE_CONFIG } from "@/types/distribution";

interface ProcessDialogProps {
  requests: DistributionRequest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Action = "received" | "delivered" | "reported" | null;

export function ProcessDialog({
  requests,
  open,
  onOpenChange,
  onSuccess,
}: ProcessDialogProps) {
  const [action, setAction] = useState<Action>(null);
  const [delegateName, setDelegateName] = useState("");
  const [delegatePhone, setDelegatePhone] = useState("");
  const [loading, setLoading] = useState(false);

  const ids = requests.map((r) => r.id);
  const isNewBatch = requests.every((r) => r.request_type === "new_batches");
  const isAlert = requests.every(
    (r) => r.request_type === "alert_late" || r.request_type === "alert_no_auth"
  );

  function handleClose() {
    onOpenChange(false);
    setAction(null);
    setDelegateName("");
    setDelegatePhone("");
  }

  async function handleConfirm() {
    if (!action) return;
    setLoading(true);

    try {
      let result: { error: string | null };

      if (action === "received") {
        result = await markRequestReceived(ids);
      } else if (action === "delivered") {
        result = await markRequestDelivered(ids, delegateName, delegatePhone);
      } else {
        result = await markRequestReported(ids);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        const labels: Record<NonNullable<Action>, string> = {
          received: "تم الاستلام",
          delivered: "تم التوصيل",
          reported: "تم الإبلاغ",
        };
        toast.success(`تم تحديث ${requests.length} طلب — ${labels[action]}`);
        onSuccess();
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>معالجة الطلبات</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Summary */}
          <div
            className="rounded-xl px-4 py-3 text-sm space-y-1"
            style={{ background: "hsl(var(--n-gold) / .07)" }}
          >
            <p className="font-semibold text-foreground">
              {requests.length === 1
                ? requests[0].company_name
                : `${requests.length} شركات محددة`}
            </p>
            {requests.length === 1 && (
              <p className="text-xs text-muted-foreground">
                {REQUEST_TYPE_CONFIG[requests[0].request_type].label}
              </p>
            )}
          </div>

          {/* Actions for new_batches */}
          {isNewBatch && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">حالة المعالجة</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAction("received")}
                  className="flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition-all duration-150"
                  style={
                    action === "received"
                      ? {
                          background: "hsl(142 71% 35% / .1)",
                          borderColor: "hsl(142 71% 35% / .4)",
                        }
                      : {}
                  }
                >
                  <CheckCircle2
                    className="h-6 w-6"
                    style={{
                      color:
                        action === "received"
                          ? "hsl(142 71% 35%)"
                          : "hsl(var(--muted-foreground))",
                    }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        action === "received"
                          ? "hsl(142 71% 35%)"
                          : "hsl(var(--foreground))",
                    }}
                  >
                    تم الاستلام
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction("delivered")}
                  className="flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition-all duration-150"
                  style={
                    action === "delivered"
                      ? {
                          background: "hsl(201 96% 32% / .1)",
                          borderColor: "hsl(201 96% 32% / .4)",
                        }
                      : {}
                  }
                >
                  <Truck
                    className="h-6 w-6"
                    style={{
                      color:
                        action === "delivered"
                          ? "hsl(201 96% 32%)"
                          : "hsl(var(--muted-foreground))",
                    }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        action === "delivered"
                          ? "hsl(201 96% 32%)"
                          : "hsl(var(--foreground))",
                    }}
                  >
                    تم التوصيل
                  </span>
                </button>
              </div>

              {/* Delegate fields for "delivered" */}
              {action === "delivered" && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم المفوض</Label>
                    <Input
                      value={delegateName}
                      onChange={(e) => setDelegateName(e.target.value)}
                      placeholder="أدخل اسم المفوض"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم جوال المفوض</Label>
                    <Input
                      value={delegatePhone}
                      onChange={(e) => setDelegatePhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action for alerts */}
          {isAlert && (
            <button
              type="button"
              onClick={() => setAction("reported")}
              className="w-full flex items-center gap-3 rounded-xl border px-4 py-4 transition-all duration-150"
              style={
                action === "reported"
                  ? {
                      background: "hsl(270 60% 50% / .1)",
                      borderColor: "hsl(270 60% 50% / .4)",
                    }
                  : {}
              }
            >
              <Bell
                className="h-5 w-5 shrink-0"
                style={{
                  color:
                    action === "reported"
                      ? "hsl(270 60% 50%)"
                      : "hsl(var(--muted-foreground))",
                }}
              />
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    action === "reported"
                      ? "hsl(270 60% 50%)"
                      : "hsl(var(--foreground))",
                }}
              >
                تم الإبلاغ
              </span>
            </button>
          )}

          {/* Mixed type warning */}
          {!isNewBatch && !isAlert && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
              style={{ background: "hsl(38 92% 50% / .1)" }}
            >
              تحتوي الطلبات المحددة على أنواع مختلطة. يرجى اختيار طلبات من نوع واحد فقط للمعالجة الجماعية.
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            إلغاء
          </Button>
          <Button
            disabled={
              !action ||
              loading ||
              (!isNewBatch && !isAlert) ||
              (action === "delivered" && (!delegateName.trim() || !delegatePhone.trim()))
            }
            onClick={handleConfirm}
            style={{ background: "hsl(var(--n-dark))", color: "hsl(var(--n-ivory))" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            تأكيد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
