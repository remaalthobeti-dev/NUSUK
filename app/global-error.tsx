"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            خطأ حرج في التطبيق
          </h1>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            {error.message || "حدث خطأ غير متوقع"}
            {error.digest && ` (${error.digest})`}
          </p>
          <button onClick={reset} style={{ padding: "0.5rem 1.5rem", cursor: "pointer" }}>
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
