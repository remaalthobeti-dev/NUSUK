"use client";

import { useRouter } from "next/navigation";
import type { ChatMessage } from "@/lib/ai/assistant";

interface MessageBubbleProps {
  message: ChatMessage;
  onQuickQuery?: (query: string) => void;
}

// Minimal markdown: **bold**, newlines, bullet lines
function renderContent(text: string): React.ReactNode {
  return text.split("\n").map((line, li) => {
    const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
    const content = isBullet ? line.replace(/^[\s\-•]+/, "") : line;

    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, pi) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={pi} style={{ fontWeight: 650 }}>{p.slice(2, -2)}</strong>
        : <span key={pi}>{p}</span>
    );

    if (isBullet) {
      return (
        <div key={li} style={{ display: "flex", gap: 6, marginTop: li === 0 ? 0 : 3 }}>
          <span style={{ color: "#C9963E", flexShrink: 0, marginTop: 1, fontSize: 11 }}>◆</span>
          <span>{parts}</span>
        </div>
      );
    }

    return (
      <div key={li} style={{ marginTop: li === 0 ? 0 : (line === "" ? 6 : 2) }}>
        {parts}
      </div>
    );
  });
}

export function MessageBubble({ message, onQuickQuery }: MessageBubbleProps) {
  const router = useRouter();
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems:    "flex-end",
        gap:           8,
      }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div
          style={{
            flexShrink:     0,
            width:          28,
            height:         28,
            borderRadius:   "50%",
            background:     "linear-gradient(145deg,#3a6b1e,#2D5016)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       13,
            fontWeight:     700,
            color:          "#C9963E",
            boxShadow:      "0 1px 6px rgba(45,80,22,.35)",
            fontFamily:     "system-ui,sans-serif",
            marginBottom:   2,
          }}
        >
          ن
        </div>
      )}

      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    isUser ? "flex-end" : "flex-start",
          gap:           6,
          maxWidth:      "78%",
        }}
      >
        {/* Bubble */}
        <div
          style={
            isUser
              ? {
                  background:   "linear-gradient(135deg, #3a6b1e 0%, #2D5016 100%)",
                  color:        "#fff",
                  borderRadius: "18px 18px 4px 18px",
                  padding:      "10px 14px",
                  fontSize:     13.5,
                  lineHeight:   1.6,
                  boxShadow:    "0 2px 10px rgba(45,80,22,.3)",
                }
              : {
                  background:   "var(--nk-bubble-bg, #f0ede7)",
                  color:        "var(--nk-bubble-text, #1A1A17)",
                  border:       "1px solid var(--nk-bubble-border, rgba(0,0,0,.08))",
                  borderRadius: "18px 18px 18px 4px",
                  padding:      "10px 14px",
                  fontSize:     13.5,
                  lineHeight:   1.6,
                  boxShadow:    "0 1px 4px rgba(0,0,0,.06)",
                }
          }
        >
          {renderContent(message.content)}
        </div>

        {/* Action buttons */}
        {message.actions && message.actions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {message.actions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  if (action.href) router.push(action.href);
                  else if (action.query && onQuickQuery) onQuickQuery(action.query);
                }}
                style={{
                  fontSize:     12,
                  padding:      "4px 12px",
                  borderRadius: 20,
                  border:       "1.5px solid #C9963E",
                  color:        "#C9963E",
                  background:   "transparent",
                  cursor:       "pointer",
                  fontFamily:   "inherit",
                  fontWeight:   600,
                  transition:   "background .15s, color .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#C9963E";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#C9963E";
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span
          style={{
            fontSize:   10,
            color:      "var(--nk-muted, #9A9A90)",
            paddingInline: 2,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
