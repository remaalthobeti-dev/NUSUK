"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { SuggestionChips } from "./suggestion-chips";
import type { ChatMessage } from "@/lib/ai/assistant";

// ── CSS tokens injected once ──────────────────────────────────────────────

const DRAWER_STYLES = `
  /* Light */
  .nk-drawer-root {
    --nk-header-from:   #1a3009;
    --nk-header-to:     #0e1f05;
    --nk-drawer-bg:     #faf8f4;
    --nk-input-bg:      #ffffff;
    --nk-input-border:  rgba(0,0,0,.12);
    --nk-sep:           rgba(0,0,0,.07);
    --nk-bubble-bg:     #f0ede7;
    --nk-bubble-text:   #1A1A17;
    --nk-bubble-border: rgba(0,0,0,.08);
    --nk-chip-bg:       rgba(201,150,62,.07);
    --nk-chip-border:   rgba(201,150,62,.35);
    --nk-chip-text:     #58584F;
    --nk-muted:         #9A9A90;
    --nk-scrollbar:     rgba(0,0,0,.1);
  }
  /* Dark */
  @media (prefers-color-scheme: dark) {
    .nk-drawer-root {
      --nk-drawer-bg:     #111a0a;
      --nk-input-bg:      #1b2811;
      --nk-input-border:  rgba(255,255,255,.1);
      --nk-sep:           rgba(255,255,255,.06);
      --nk-bubble-bg:     #1e2a14;
      --nk-bubble-text:   #e8e5dd;
      --nk-bubble-border: rgba(255,255,255,.08);
      --nk-chip-bg:       rgba(201,150,62,.1);
      --nk-chip-border:   rgba(201,150,62,.3);
      --nk-chip-text:     #b8b59e;
      --nk-muted:         #6a6a60;
      --nk-scrollbar:     rgba(255,255,255,.1);
    }
  }
  :root[data-theme="dark"] .nk-drawer-root {
    --nk-drawer-bg:     #111a0a;
    --nk-input-bg:      #1b2811;
    --nk-input-border:  rgba(255,255,255,.1);
    --nk-sep:           rgba(255,255,255,.06);
    --nk-bubble-bg:     #1e2a14;
    --nk-bubble-text:   #e8e5dd;
    --nk-bubble-border: rgba(255,255,255,.08);
    --nk-chip-bg:       rgba(201,150,62,.1);
    --nk-chip-border:   rgba(201,150,62,.3);
    --nk-chip-text:     #b8b59e;
    --nk-muted:         #6a6a60;
    --nk-scrollbar:     rgba(255,255,255,.1);
  }
  :root[data-theme="light"] .nk-drawer-root {
    --nk-drawer-bg:     #faf8f4;
    --nk-input-bg:      #ffffff;
    --nk-input-border:  rgba(0,0,0,.12);
    --nk-sep:           rgba(0,0,0,.07);
    --nk-bubble-bg:     #f0ede7;
    --nk-bubble-text:   #1A1A17;
    --nk-bubble-border: rgba(0,0,0,.08);
    --nk-chip-bg:       rgba(201,150,62,.07);
    --nk-chip-border:   rgba(201,150,62,.35);
    --nk-chip-text:     #58584F;
    --nk-muted:         #9A9A90;
    --nk-scrollbar:     rgba(0,0,0,.1);
  }

  /* Scrollbar */
  .nk-messages::-webkit-scrollbar { width: 4px; }
  .nk-messages::-webkit-scrollbar-track { background: transparent; }
  .nk-messages::-webkit-scrollbar-thumb {
    background: var(--nk-scrollbar);
    border-radius: 2px;
  }

  /* Animations */
  @keyframes nk-drawer-in {
    from { opacity: 0; transform: translateY(16px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes nk-drawer-out {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(16px) scale(.97); }
  }
  @keyframes nk-dot-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: .4; }
    40%           { transform: translateY(-4px); opacity: 1; }
  }
  .nk-dot { animation: nk-dot-bounce 1.2s ease-in-out infinite; }
  .nk-dot:nth-child(2) { animation-delay: .15s; }
  .nk-dot:nth-child(3) { animation-delay: .30s; }

  @media (prefers-reduced-motion: reduce) {
    .nk-dot { animation: none; opacity: .6; }
  }

  /* Geometric header decoration */
  .nk-header-geo {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }
  .nk-header-geo svg {
    position: absolute;
    left: -18px;
    top: -18px;
    opacity: .09;
  }
`;

// ── Welcome message ───────────────────────────────────────────────────────

const WELCOME: ChatMessage = {
  role: "assistant",
  content: `أهلاً! أنا **مساعد نسّق الذكي**\n\nاسألني عن المهام، حضور الفريق، التوزيع، أو أي شيء في المنصة. اختر من الاقتراحات أو اكتب سؤالك مباشرةً:`,
  actions: [],
  timestamp: new Date().toISOString(),
};

// ── API call ──────────────────────────────────────────────────────────────

async function sendMessage(text: string) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "خطأ في الاتصال");
  }
  return res.json() as Promise<{ content: string; actions?: { label: string; href?: string; query?: string }[] }>;
}

// ── Geometric SVG decoration for header ──────────────────────────────────

function HeaderGeo() {
  // Simple 8-pointed star — same vocabulary as the brand's Islamic ornaments
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a   = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? 48 : 20;
    pts.push(`${+(Math.cos(a) * rad).toFixed(1)},${+(Math.sin(a) * rad).toFixed(1)}`);
  }
  const star = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(" ")}Z`;

  return (
    <div className="nk-header-geo">
      <svg width="120" height="120" viewBox="-60 -60 120 120">
        <g stroke="#C9963E" fill="none">
          <circle r="55" strokeWidth="0.8" />
          <path d={star} strokeWidth="1.2" />
          <circle r="22" strokeWidth="0.7" />
        </g>
      </svg>
      {/* Second smaller star at the right edge */}
      <svg
        width="70" height="70" viewBox="-35 -35 70 70"
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.07 }}
      >
        <g stroke="#C9963E" fill="none">
          <circle r="32" strokeWidth="0.7" />
          <path d={star.replace(/[\d.-]+(?=,|$)/g, (n) => String(+n * 0.6))} strokeWidth="0.9" />
        </g>
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AssistantDrawer({ open, onClose }: AssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [isPending, startTransition] = useTransition();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, timestamp: new Date().toISOString() },
    ]);
    setInput("");
    setShowSuggestions(false);

    startTransition(async () => {
      try {
        const data = await sendMessage(trimmed);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content, actions: data.actions, timestamp: new Date().toISOString() },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "حدث خطأ في الاتصال. تأكد من اتصالك بالشبكة وحاول مجدداً.", timestamp: new Date().toISOString() },
        ]);
      }
    });
  }

  return (
    <>
      <style>{DRAWER_STYLES}</style>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,.22)",
            backdropFilter: "blur(1px)",
          }}
          className="lg:hidden"
        />
      )}

      {/* Drawer */}
      <div
        dir="rtl"
        className="nk-drawer-root"
        style={{
          position:      "fixed",
          bottom:        24,
          insetInlineEnd: 84,         /* sits beside the FAB */
          zIndex:        50,
          width:         "min(400px, calc(100vw - 24px))",
          height:        "min(580px, 85vh)",
          borderRadius:  20,
          overflow:      "hidden",
          display:       "flex",
          flexDirection: "column",
          background:    "var(--nk-drawer-bg)",
          boxShadow:     "0 8px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12)",
          border:        "1px solid rgba(201,150,62,.18)",
          transformOrigin: "bottom right",
          transition:    "opacity .25s cubic-bezier(.23,1,.32,1), transform .25s cubic-bezier(.23,1,.32,1)",
          opacity:       open ? 1 : 0,
          transform:     open ? "translateY(0) scale(1)" : "translateY(14px) scale(.96)",
          pointerEvents: open ? "auto" : "none",
        }}
      >

        {/* ── Header ── */}
        <div
          style={{
            position:   "relative",
            padding:    "14px 18px",
            background: "linear-gradient(135deg, var(--nk-header-from,#1a3009) 0%, var(--nk-header-to,#0e1f05) 100%)",
            flexShrink: 0,
            borderBottom: "1px solid rgba(201,150,62,.25)",
          }}
        >
          <HeaderGeo />

          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Brand mark + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width:          36,
                  height:         36,
                  borderRadius:   "50%",
                  border:         "1.5px solid rgba(201,150,62,.5)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  background:     "rgba(201,150,62,.12)",
                  flexShrink:     0,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: "#C9963E", fontFamily: "system-ui,sans-serif" }}>ن</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>
                  مساعد نسّق الذكي
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.55)" }}>يعمل الآن</p>
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="إغلاق"
              style={{
                background:     "rgba(255,255,255,.08)",
                border:         "none",
                borderRadius:   10,
                width:          30,
                height:         30,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                cursor:         "pointer",
                transition:     "background .15s",
                color:          "rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.08)"; }}
            >
              <X style={{ width: 15, height: 15 }} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          className="nk-messages"
          style={{
            flex:      1,
            overflowY: "auto",
            padding:   "16px 16px 8px",
            display:   "flex",
            flexDirection: "column",
            gap:       12,
          }}
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} onQuickQuery={submit} />
          ))}

          {/* Typing indicator */}
          {isPending && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div
                style={{
                  width:          28, height: 28,
                  borderRadius:   "50%",
                  background:     "linear-gradient(145deg,#3a6b1e,#2D5016)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  fontSize:       13, fontWeight: 700,
                  color:          "#C9963E",
                  flexShrink:     0,
                  marginBottom:   2,
                }}
              >ن</div>
              <div
                style={{
                  background:   "var(--nk-bubble-bg)",
                  border:       "1px solid var(--nk-bubble-border)",
                  borderRadius: "18px 18px 18px 4px",
                  padding:      "12px 16px",
                  display:      "flex",
                  gap:          5,
                  alignItems:   "center",
                }}
              >
                <span className="nk-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9963E", display: "block" }} />
                <span className="nk-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9963E", display: "block" }} />
                <span className="nk-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9963E", display: "block" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ── */}
        {showSuggestions && (
          <div
            style={{
              padding:      "10px 16px 8px",
              borderTop:    "1px solid var(--nk-sep)",
              flexShrink:   0,
            }}
          >
            <p style={{ margin: "0 0 7px", fontSize: 11, color: "var(--nk-muted)", fontWeight: 500 }}>
              اقتراحات سريعة
            </p>
            <SuggestionChips onSelect={submit} />
          </div>
        )}

        {/* ── Input ── */}
        <div
          style={{
            padding:    "10px 12px 14px",
            borderTop:  "1px solid var(--nk-sep)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              background:   "var(--nk-input-bg)",
              border:       "1.5px solid var(--nk-input-border)",
              borderRadius: 14,
              padding:      "6px 6px 6px 10px",
              transition:   "border-color .2s",
            }}
            onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,150,62,.6)"; }}
            onBlurCapture={(e)  => { (e.currentTarget as HTMLElement).style.borderColor = "var(--nk-input-border)"; }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
              placeholder="اكتب سؤالك..."
              disabled={isPending}
              style={{
                flex:        1,
                fontSize:    13.5,
                border:      "none",
                outline:     "none",
                background:  "transparent",
                color:       "inherit",
                fontFamily:  "inherit",
                direction:   "rtl",
                minWidth:    0,
                opacity:     isPending ? .5 : 1,
              }}
            />

            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || isPending}
              aria-label="إرسال"
              style={{
                flexShrink:     0,
                width:          34,
                height:         34,
                borderRadius:   10,
                border:         "none",
                cursor:         input.trim() && !isPending ? "pointer" : "default",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                background:     input.trim() && !isPending
                  ? "linear-gradient(135deg,#3a6b1e,#2D5016)"
                  : "rgba(0,0,0,.06)",
                color:          input.trim() && !isPending ? "#fff" : "#aaa",
                transition:     "background .2s, color .2s",
              }}
            >
              {isPending
                ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                : <Send style={{ width: 14, height: 14, transform: "scaleX(-1)" }} strokeWidth={2.2} />
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
