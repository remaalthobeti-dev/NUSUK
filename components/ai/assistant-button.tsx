"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { AssistantDrawer } from "./assistant-drawer";
import { cn } from "@/lib/utils";

export function AssistantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AssistantDrawer open={open} onClose={() => setOpen(false)} />

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="مساعد نسّق الذكي"
        className={cn(
          "fixed bottom-6 end-6 z-50",
          "w-13 h-13 rounded-2xl shadow-lg",
          "flex items-center justify-center gap-0",
          "transition-all duration-200 active:scale-95 hover:shadow-xl",
          open && "rotate-0"
        )}
        style={{
          width: 52,
          height: 52,
          background: open
            ? "var(--n-dark,#1A1A17)"
            : "linear-gradient(135deg, var(--n-forest,#2D5016) 0%, #1a3009 100%)",
          color: "#fff",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.35)"
            : "0 4px 20px rgba(45,80,22,0.45), 0 0 0 0 rgba(201,150,62,0)",
        }}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </button>

      {/* Tooltip on first visit */}
      {!open && (
        <div
          className="fixed bottom-[72px] end-6 z-50 pointer-events-none"
          style={{ animation: "n-rise .5s ease 1.5s both" }}
        >
          <div
            className="text-xs px-2.5 py-1 rounded-lg shadow text-white whitespace-nowrap"
            style={{ background: "var(--n-dark,#1A1A17)", opacity: 0.85 }}
          >
            مساعد نسّق الذكي ✨
          </div>
        </div>
      )}
    </>
  );
}
