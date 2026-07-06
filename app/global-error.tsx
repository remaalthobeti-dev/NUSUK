"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "'Cairo', sans-serif",
          textAlign: "center",
          padding: "2rem",
          background: "#FAFAF7",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.15'/%3E%3C/svg%3E\")",
        }}
      >
        <div style={{ maxWidth: 380, width: "100%" }}>
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #091F14, #143825)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 8px 32px rgba(9,31,20,.25)",
            }}
          >
            <span style={{ fontSize: 32 }}>⚠️</span>
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#1A1A17",
              marginBottom: 8,
              letterSpacing: "-0.5px",
            }}
          >
            خطأ حرج في التطبيق
          </h1>
          <p style={{ color: "#9A9A90", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
            {error.message || "حدث خطأ غير متوقع. يرجى إعادة المحاولة."}
          </p>
          {error.digest && (
            <p style={{ color: "#C0C0B8", fontSize: 11, fontFamily: "monospace", marginBottom: 24 }}>
              #{error.digest}
            </p>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(201,150,62,.2)" }} />
            <div
              style={{
                width: 8,
                height: 8,
                background: "transparent",
                border: "1px solid rgba(201,150,62,.4)",
                transform: "rotate(45deg)",
              }}
            />
            <div style={{ flex: 1, height: 1, background: "rgba(201,150,62,.2)" }} />
          </div>

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 44,
              padding: "0 28px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(145deg, #0D2418, #091F14)",
              color: "#FAFAF7",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Cairo', sans-serif",
              boxShadow: "0 4px 18px rgba(9,31,20,.3)",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
