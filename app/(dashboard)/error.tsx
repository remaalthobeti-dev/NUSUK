"use client";

import { useEffect } from "react";
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="text-muted-foreground text-sm">
          {error.message || "فشل تحميل لوحة التحكم"}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            معرّف الخطأ: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={reset} variant="default">
            إعادة المحاولة
          </Button>
          <Button onClick={() => (window.location.href = "/login")} variant="outline">
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}
