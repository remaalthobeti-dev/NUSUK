"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { SuggestionChips } from "./suggestion-chips";
import type { ChatMessage } from "@/lib/ai/assistant";
import { cn } from "@/lib/utils";

// ── CSS (light-first, inherits card/bg tokens from the site) ─────────────

const STYLES = `
  .nk-chat-panel {
    --nk-panel-bg:      hsl(var(--card));
    --nk-panel-border:  hsl(var(--border));
    --nk-bubble-user-bg:    hsl(149 45% 15%);   /* --n-forest */
    --nk-bubble-user-text:  #fff;
    --nk-bubble-ai-bg:      hsl(45 25% 95%);    /* --n-ivory-2 */
    --nk-bubble-ai-text:    hsl(60 5% 10%);     /* --n-ink */
    --nk-bubble-ai-border:  hsl(40 20% 89%);    /* --n-ivory-3 */
    --nk-input-bg:      hsl(var(--background));
    --nk-input-border:  hsl(var(--border));
    --nk-sep:           hsl(var(--border));
    --nk-muted-text:    hsl(60 5% 60%);
    --nk-gold:          hsl(36 57% 51%);
    --nk-scrollbar:     hsl(45 25% 88%);
    --nk-bubble-bg:     hsl(45 25% 95%);
    --nk-bubble-text:   hsl(60 5% 10%);
    --nk-bubble-border: hsl(40 20% 89%);
    --nk-chip-bg:       hsl(45 25% 95%);
    --nk-chip-border:   hsl(36 57% 51% / .35);
    --nk-chip-text:     hsl(60 5% 35%);
    --nk-muted:         hsl(60 5% 60%);
  }

  .dark .nk-chat-panel,
  :root[data-theme="dark"] .nk-chat-panel {
    --nk-bubble-ai-bg:      hsl(var(--muted));
    --nk-bubble-ai-text:    hsl(var(--foreground));
    --nk-bubble-ai-border:  hsl(var(--border));
    --nk-bubble-bg:     hsl(var(--muted));
    --nk-bubble-text:   hsl(var(--foreground));
    --nk-bubble-border: hsl(var(--border));
    --nk-chip-bg:       hsl(var(--muted));
    --nk-chip-border:   hsl(36 57% 51% / .3);
    --nk-chip-text:     hsl(var(--muted-foreground));
    --nk-muted:         hsl(var(--muted-foreground));
    --nk-scrollbar:     hsl(var(--muted-foreground) / .2);
    --nk-input-bg:      hsl(var(--card));
  }

  .nk-chat-panel .nk-msgs::-webkit-scrollbar { width: 3px; }
  .nk-chat-panel .nk-msgs::-webkit-scrollbar-track { background: transparent; }
  .nk-chat-panel .nk-msgs::-webkit-scrollbar-thumb {
    background: var(--nk-scrollbar);
    border-radius: 2px;
  }

  @keyframes nk-panel-in {
    from { opacity: 0; transform: translateY(-8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  .nk-panel-open {
    animation: nk-panel-in .2s cubic-bezier(.23,1,.32,1) both;
  }

  @keyframes nk-typing {
    0%,80%,100% { transform: translateY(0);    opacity: .4; }
    40%         { transform: translateY(-3px); opacity: 1; }
  }
  .nk-dot-1 { animation: nk-typing 1.1s ease-in-out infinite; }
  .nk-dot-2 { animation: nk-typing 1.1s ease-in-out .15s infinite; }
  .nk-dot-3 { animation: nk-typing 1.1s ease-in-out .30s infinite; }

  @media (prefers-reduced-motion: reduce) {
    .nk-panel-open { animation: none; }
    .nk-dot-1,.nk-dot-2,.nk-dot-3 { animation: none; opacity: .7; }
  }
`;

// ── Welcome ───────────────────────────────────────────────────────────────

const WELCOME: ChatMessage = {
  role: "assistant",
  content: `أهلاً! أنا **مساعد نسّق الذكي**\n\nاسألني عن المهام، حضور الفريق، التوزيع، أو أي شيء في المنصة:`,
  actions: [],
  timestamp: new Date().toISOString(),
};

async function callChat(text: string) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "خطأ");
  return res.json() as Promise<{ content: string; actions?: { label: string; href?: string; query?: string }[] }>;
}

// ── Component ─────────────────────────────────────────────────────────────

export function AssistantNavButton() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput]   = useState("");
  const [showChips, setShowChips] = useState(true);
  const [isPending, startT] = useTransition();
  const panelRef  = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isPending]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || isPending) return;
    setMsgs((p) => [...p, { role: "user", content: t, timestamp: new Date().toISOString() }]);
    setInput("");
    setShowChips(false);
    startT(async () => {
      try {
        const d = await callChat(t);
        setMsgs((p) => [...p, { role: "assistant", content: d.content, actions: d.actions, timestamp: new Date().toISOString() }]);
      } catch {
        setMsgs((p) => [...p, { role: "assistant", content: "حدث خطأ في الاتصال، حاول مجدداً.", timestamp: new Date().toISOString() }]);
      }
    });
  }

  return (
    <>
      <style>{STYLES}</style>

      {/* Trigger button — sits in the navbar actions row */}
      <div ref={panelRef} style={{ position: "relative" }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label="مساعد نسّق الذكي"
          className={cn(open && "bg-muted")}
        >
          {open
            ? <X className="h-5 w-5" />
            : <Sparkles className="h-[18px] w-[18px]" style={{ color: "hsl(36 57% 51%)" }} />
          }
        </Button>

        {/* Panel — drops down from the button */}
        {open && (
          <div
            dir="rtl"
            className="nk-chat-panel nk-panel-open"
            style={{
              position:        "absolute",
              top:             "calc(100% + 10px)",
              insetInlineEnd:  0,
              width:           "min(400px, 92vw)",
              height:          "min(540px, 80vh)",
              borderRadius:    "var(--n-radius-xl, 20px)",
              border:          "1px solid var(--nk-panel-border)",
              background:      "var(--nk-panel-bg)",
              boxShadow:       "var(--n-shadow-card, 0 8px 32px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.08))",
              display:         "flex",
              flexDirection:   "column",
              overflow:        "hidden",
              zIndex:          60,
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                padding:      "13px 16px 12px",
                borderBottom: "1px solid var(--nk-sep)",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "space-between",
                flexShrink:   0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Gold ring avatar */}
                <div
                  style={{
                    width:          34,
                    height:         34,
                    borderRadius:   "50%",
                    border:         "2px solid hsl(36 57% 51% / .45)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    background:     "hsl(149 45% 15% / .08)",
                    flexShrink:     0,
                  }}
                >
                  <span
                    style={{
                      fontSize:   15,
                      fontWeight: 700,
                      color:      "hsl(149 45% 22%)",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    ن
                  </span>
                </div>

                <div>
                  <p
                    style={{
                      margin:      0,
                      fontSize:    14,
                      fontWeight:  650,
                      color:       "hsl(var(--foreground))",
                      letterSpacing: ".2px",
                    }}
                  >
                    مساعد نسّق الذكي
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                    <span
                      style={{
                        width: 6, height: 6,
                        borderRadius: "50%",
                        background: "hsl(142 71% 35%)",
                        flexShrink: 0,
                      }}
                    />
                    <p style={{ margin: 0, fontSize: 11, color: "var(--nk-muted-text)" }}>
                      يعمل الآن
                    </p>
                  </div>
                </div>
              </div>

              {/* Gold accent line */}
              <div
                style={{
                  height:     2,
                  width:      32,
                  background: "linear-gradient(90deg, hsl(36 57% 51%), transparent)",
                  borderRadius: 2,
                  alignSelf:  "center",
                  opacity:    0.7,
                }}
              />
            </div>

            {/* ── Messages ── */}
            <div
              className="nk-msgs"
              style={{
                flex:      1,
                overflowY: "auto",
                padding:   "14px 14px 8px",
                display:   "flex",
                flexDirection: "column",
                gap:       10,
              }}
            >
              {msgs.map((m, i) => (
                <MessageBubble key={i} message={m} onQuickQuery={submit} />
              ))}

              {isPending && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div
                    style={{
                      width:  26, height: 26,
                      borderRadius: "50%",
                      border: "1.5px solid hsl(36 57% 51% / .4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                      color: "hsl(149 45% 22%)",
                      flexShrink: 0, marginBottom: 2,
                    }}
                  >ن</div>
                  <div
                    style={{
                      background:   "var(--nk-bubble-ai-bg)",
                      border:       "1px solid var(--nk-bubble-ai-border)",
                      borderRadius: "14px 14px 14px 3px",
                      padding:      "10px 14px",
                      display:      "flex",
                      gap:          4,
                      alignItems:   "center",
                    }}
                  >
                    {["nk-dot-1","nk-dot-2","nk-dot-3"].map((cls) => (
                      <span
                        key={cls}
                        className={cls}
                        style={{
                          width: 5, height: 5,
                          borderRadius: "50%",
                          background: "hsl(36 57% 51%)",
                          display: "block",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Suggestions ── */}
            {showChips && (
              <div
                style={{
                  padding:    "8px 14px 6px",
                  borderTop:  "1px solid var(--nk-sep)",
                  flexShrink: 0,
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--nk-muted-text)", fontWeight: 500 }}>
                  اقتراحات سريعة
                </p>
                <SuggestionChips onSelect={submit} />
              </div>
            )}

            {/* ── Input ── */}
            <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--nk-sep)", flexShrink: 0 }}>
              <div
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          6,
                  background:   "var(--nk-input-bg)",
                  border:       "1.5px solid var(--nk-input-border)",
                  borderRadius: "var(--n-radius-md, 9px)",
                  padding:      "5px 5px 5px 10px",
                  transition:   "border-color .18s",
                }}
                onFocusCapture={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(36 57% 51% / .55)";
                }}
                onBlurCapture={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--nk-input-border)";
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
                  }}
                  placeholder="اكتب سؤالك..."
                  disabled={isPending}
                  style={{
                    flex:       1,
                    fontSize:   13.5,
                    border:     "none",
                    outline:    "none",
                    background: "transparent",
                    color:      "hsl(var(--foreground))",
                    fontFamily: "inherit",
                    direction:  "rtl",
                    minWidth:   0,
                    opacity:    isPending ? .5 : 1,
                  }}
                />
                <button
                  onClick={() => submit(input)}
                  disabled={!input.trim() || isPending}
                  aria-label="إرسال"
                  style={{
                    flexShrink:  0,
                    width:       32, height: 32,
                    borderRadius: "var(--n-radius-sm, 6px)",
                    border:      "none",
                    cursor:      input.trim() && !isPending ? "pointer" : "default",
                    display:     "flex",
                    alignItems:  "center",
                    justifyContent: "center",
                    background:  input.trim() && !isPending
                      ? "hsl(149 45% 15%)"
                      : "hsl(var(--muted))",
                    color:       input.trim() && !isPending
                      ? "#fff"
                      : "hsl(var(--muted-foreground))",
                    transition:  "background .18s, color .18s",
                  }}
                >
                  {isPending
                    ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
                    : <Send style={{ width: 13, height: 13, transform: "scaleX(-1)" }} strokeWidth={2.3} />
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
