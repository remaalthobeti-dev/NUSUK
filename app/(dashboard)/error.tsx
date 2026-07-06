"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div
          className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--n-warning) / .1)", border: "1.5px solid hsl(var(--n-warning) / .2)" }}
        >
          <AlertTriangle className="h-7 w-7" style={{ color: "hsl(var(--n-warning))" }} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error.message || "فشل تحميل الصفحة. يرجى المحاولة مرة أخرى."}
          </p>
          {error.digest && (
            <p className="text-[11px] text-muted-foreground/50 font-mono mt-1">#{error.digest}</p>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/login")} className="gap-2">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}
