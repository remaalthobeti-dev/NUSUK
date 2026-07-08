"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "@/lib/ai/assistant";

interface MessageBubbleProps {
  message: ChatMessage;
  onQuickQuery?: (query: string) => void;
}

// Minimal markdown: **bold** and newlines
function parseContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const nodes = parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pi}>{part.slice(2, -2)}</strong>;
      }
      return <span key={pi}>{part}</span>;
    });
    return (
      <span key={li} className={li > 0 ? "block mt-0.5" : ""}>
        {nodes}
      </span>
    );
  });
}

export function MessageBubble({ message, onQuickQuery }: MessageBubbleProps) {
  const router = useRouter();
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      {!isUser && (
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
          style={{ background: "var(--n-gold, #C9963E)", color: "#fff" }}
        >
          ✨
        </div>
      )}

      <div className={cn("flex flex-col gap-1.5 max-w-[82%]", isUser ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "text-white rounded-tr-sm"
              : "rounded-tl-sm"
          )}
          style={
            isUser
              ? { background: "var(--n-forest, #2D5016)" }
              : { background: "var(--muted, #f4f4f0)", color: "var(--foreground)" }
          }
        >
          {parseContent(message.content)}
        </div>

        {/* Action buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {message.actions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  if (action.href) router.push(action.href);
                  else if (action.query && onQuickQuery) onQuickQuery(action.query);
                }}
                className="text-xs px-3 py-1 rounded-full border transition-colors hover:opacity-80 active:scale-95"
                style={{
                  borderColor: "var(--n-gold, #C9963E)",
                  color: "var(--n-gold, #C9963E)",
                  background: "transparent",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {new Date(message.timestamp).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
