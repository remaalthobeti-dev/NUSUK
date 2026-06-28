"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  dueDate: string;
  className?: string;
}

function computeParts(dueDate: string) {
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s, diff };
}

export function CountdownTimer({ dueDate, className }: CountdownTimerProps) {
  const [parts, setParts] = useState(() => computeParts(dueDate));

  useEffect(() => {
    const id = setInterval(() => setParts(computeParts(dueDate)), 1_000);
    return () => clearInterval(id);
  }, [dueDate]);

  if (!parts) {
    return (
      <span className={cn("text-red-600 dark:text-red-400 font-bold", className)}>
        منتهية الوقت
      </span>
    );
  }

  const isUrgent = parts.diff < 3_600_000; // under 1 hour

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-mono font-bold text-lg",
        isUrgent
          ? "text-red-600 dark:text-red-400"
          : "text-foreground",
        className
      )}
      dir="ltr"
    >
      <TimeBlock value={parts.h} label="س" />
      <span className="text-muted-foreground">:</span>
      <TimeBlock value={parts.m} label="د" />
      <span className="text-muted-foreground">:</span>
      <TimeBlock value={parts.s} label="ث" />
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tabular-nums w-8 text-center">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] text-muted-foreground font-sans font-normal">
        {label}
      </span>
    </div>
  );
}
