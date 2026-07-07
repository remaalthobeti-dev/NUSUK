"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCommentAction } from "@/app/(dashboard)/dashboard/assignments/[taskId]/actions";
import type { TaskCommentEntry } from "@/lib/data/task-detail";
import { timeAgo } from "@/components/assignments/card-utils";

interface Props {
  taskId: string;
  comments: TaskCommentEntry[];
  currentEmployeeId: string;
}

export function CommentsTab({ taskId, comments, currentEmployeeId }: Props) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  function handleSubmit() {
    if (!text.trim()) return;
    setLocalError(null);
    startTransition(async () => {
      const { error } = await addCommentAction(taskId, text);
      if (error) {
        setLocalError(error);
      } else {
        setText("");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Comment list ── */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--n-gold) / .08)", border: "1.5px solid hsl(var(--n-gold) / .18)" }}>
            <MessageSquare className="h-6 w-6" style={{ color: "hsl(var(--n-gold) / .5)" }} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">لا توجد تعليقات بعد — كن أول من يعلّق</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isMe = c.employee_id === currentEmployeeId;
            return (
              <li
                key={c.id}
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                  {(c.employee?.full_name ?? "?").charAt(0)}
                </div>
                <div className={`flex-1 min-w-0 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-ee-none"
                        : "bg-muted rounded-es-none"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {c.employee?.full_name ?? "—"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{c.comment}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 px-1">
                    {timeAgo(c.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
          <div ref={bottomRef} />
        </ul>
      )}

      {/* ── Input ── */}
      <div className="rounded-xl border bg-card p-4 space-y-3 sticky bottom-0">
        {localError && (
          <p className="text-xs text-red-600 dark:text-red-400">{localError}</p>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="أضف تعليقاً…"
          rows={2}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isPending ? "جاري الإرسال…" : "إرسال"}
          </Button>
        </div>
      </div>
    </div>
  );
}
