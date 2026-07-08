"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { SuggestionChips } from "./suggestion-chips";
import type { ChatMessage } from "@/lib/ai/assistant";

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content: `أهلاً! أنا **مساعد نسّق الذكي** ✨\n\nاسألني عن المهام، الحضور، التوزيع، أو أي شيء في المنصة. اختر من الاقتراحات أو اكتب سؤالك:`,
  actions: [],
  timestamp: new Date().toISOString(),
};

async function sendMessage(text: string): Promise<{ content: string; actions?: { label: string; href?: string; query?: string }[] }> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "خطأ في الاتصال");
  }
  return res.json();
}

export function AssistantDrawer({ open, onClose }: AssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);

    startTransition(async () => {
      try {
        const data = await sendMessage(trimmed);
        const botMsg: ChatMessage = {
          role: "assistant",
          content: data.content,
          actions: data.actions,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const errMsg: ChatMessage = {
          role: "assistant",
          content: "حدث خطأ في الاتصال. تأكد من اتصالك بالشبكة وحاول مجدداً.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        dir="rtl"
        className={cn(
          "fixed bottom-0 end-0 z-50 flex flex-col",
          "w-[min(400px,100vw)] h-[min(600px,85vh)]",
          "rounded-t-2xl lg:rounded-2xl lg:bottom-20 lg:end-6",
          "shadow-2xl border bg-background",
          "transition-all duration-300 ease-out",
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b rounded-t-2xl"
          style={{ background: "linear-gradient(135deg, var(--n-forest,#2D5016) 0%, #1a3009 100%)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <div>
              <p className="text-sm font-bold text-white leading-tight">مساعد نسّق الذكي</p>
              <p className="text-[10px] text-white/60">اسألني بالعربي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} onQuickQuery={submit} />
          ))}

          {/* Typing indicator */}
          {isPending && (
            <div className="flex gap-2">
              <div
                className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs"
                style={{ background: "var(--n-gold,#C9963E)", color: "#fff" }}
              >
                ✨
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1"
                style={{ background: "var(--muted,#f4f4f0)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="px-3 pb-2 border-t pt-2">
            <SuggestionChips onSelect={submit} />
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              disabled={isPending}
              className="flex-1 text-sm rounded-xl border px-3 py-2 bg-background outline-none focus:ring-1 disabled:opacity-50"
              style={{ fontFamily: "inherit" }}
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || isPending}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 active:scale-95"
              style={{ background: "var(--n-forest,#2D5016)", color: "#fff" }}
              aria-label="إرسال"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
