"use client";

import { AlertTriangle, Bell, CheckCheck, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SystemAlert } from "@/hooks/use-alert-checker";

interface AlertsPanelProps {
  alerts: SystemAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function AlertsPanel({ alerts, onDismiss, onDismissAll }: AlertsPanelProps) {
  if (alerts.length === 0) return null;

  const errors = alerts.filter((a) => a.severity === "error");
  const warnings = alerts.filter((a) => a.severity === "warning");

  return (
    <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">
            تنبيهات ({alerts.length})
          </span>
          {errors.length > 0 && (
            <span className="text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
              {errors.length} حرجة
            </span>
          )}
          {warnings.length > 0 && (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              {warnings.length} تحذير
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismissAll}
          className="h-7 text-xs text-muted-foreground"
        >
          <CheckCheck className="h-3 w-3 me-1" />
          تجاهل الكل
        </Button>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => onDismiss(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onDismiss,
}: {
  alert: SystemAlert;
  onDismiss: () => void;
}) {
  const isError = alert.severity === "error";

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-3 text-sm",
        isError
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
      )}
    >
      {isError ? (
        <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-semibold text-xs",
            isError
              ? "text-red-800 dark:text-red-300"
              : "text-amber-800 dark:text-amber-300"
          )}
        >
          {alert.title}
        </p>
        <p
          className={cn(
            "text-[11px] mt-0.5 leading-relaxed",
            isError
              ? "text-red-700 dark:text-red-400"
              : "text-amber-700 dark:text-amber-400"
          )}
        >
          {alert.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          "shrink-0 rounded-sm opacity-60 hover:opacity-100 transition-opacity",
          isError ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
