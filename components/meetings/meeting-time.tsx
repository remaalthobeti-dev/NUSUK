"use client";

import { useEffect, useState } from "react";

const TZ = "Asia/Riyadh";

function format(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString("ar", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const t1 = s.toLocaleTimeString("ar", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  const t2 = e.toLocaleTimeString("ar", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  return `${date} • ${t1} – ${t2}`;
}

export function MeetingTime({
  startTime,
  endTime,
  className,
}: {
  startTime: string;
  endTime: string;
  className?: string;
}) {
  const [label, setLabel] = useState<string>("...");

  useEffect(() => {
    setLabel(format(startTime, endTime));
  }, [startTime, endTime]);

  return <span className={className}>{label}</span>;
}

export function MeetingShortTime({
  startTime,
  endTime,
  className,
}: {
  startTime: string;
  endTime: string;
  className?: string;
}) {
  const [label, setLabel] = useState<string>("...");

  useEffect(() => {
    const s = new Date(startTime);
    const e = new Date(endTime);
    const t1 = s.toLocaleTimeString("ar", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    const t2 = e.toLocaleTimeString("ar", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    setLabel(`${t1} – ${t2}`);
  }, [startTime, endTime]);

  return <span className={className}>{label}</span>;
}
