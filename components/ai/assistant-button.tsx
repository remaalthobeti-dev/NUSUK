"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AssistantDrawer } from "./assistant-drawer";

export function AssistantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes nk-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%       { transform: scale(1.18); opacity: 0; }
        }
        @keyframes nk-btn-enter {
          from { opacity: 0; transform: translateY(12px) scale(.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nk-fab {
          animation: nk-btn-enter .45s cubic-bezier(.23,1,.32,1) .6s both;
        }
        .nk-fab-ring {
          animation: nk-ring-pulse 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .nk-fab { animation: none; opacity: 1; }
          .nk-fab-ring { animation: none; }
        }
      `}</style>

      <AssistantDrawer open={open} onClose={() => setOpen(false)} />

      {/* Floating action button */}
      <div className="nk-fab fixed bottom-6 end-6 z-50" style={{ direction: "ltr" }}>
        {/* Pulsing ring — hidden when open */}
        {!open && (
          <span
            className="nk-fab-ring absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: "2px solid #C9963E",
              borderRadius: "50%",
            }}
          />
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="مساعد نسّق الذكي"
          style={{
            position:     "relative",
            width:        52,
            height:       52,
            borderRadius: "50%",
            border:       "none",
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            background:   open
              ? "#1A1A17"
              : "linear-gradient(145deg, #3a6b1e 0%, #2D5016 60%, #1a3009 100%)",
            boxShadow: open
              ? "0 2px 12px rgba(0,0,0,.35)"
              : "0 4px 18px rgba(45,80,22,.5), 0 1px 4px rgba(0,0,0,.2)",
            transition: "background .25s, box-shadow .25s, transform .15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.07)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          {open ? (
            <X style={{ width: 18, height: 18, color: "#fff" }} strokeWidth={2.5} />
          ) : (
            /* Arabic ن letter mark + sparkle feel */
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <text
                x="11" y="15.5"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#C9963E"
                fontFamily="system-ui, sans-serif"
              >
                ن
              </text>
              <circle cx="17" cy="5" r="2" fill="#C9963E" opacity=".9" />
              <circle cx="17" cy="5" r="1" fill="#fff" opacity=".7" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
