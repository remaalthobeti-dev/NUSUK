"use client";

import { useState, useEffect, useTransition } from "react";
import { Gauge, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateFactoryPressureAction } from "@/app/(dashboard)/dashboard/factory-actions";

export type PressureLevel = "low" | "medium" | "high";

interface FactoryPressure {
  level: PressureLevel;
  updated_at: string;
}

interface FactoryHomeClientProps {
  employeeName: string;
  currentPressure: FactoryPressure | null;
}

const LEVELS: Array<{
  value: PressureLevel;
  label: string;
  emoji: string;
  description: string;
  bg: string;
  border: string;
  text: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}> = [
  {
    value: "low",
    label: "Low",
    emoji: "🟢",
    description: "Operations running smoothly",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-100 dark:border-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    activeBg: "bg-emerald-500",
    activeBorder: "border-emerald-500",
    activeText: "text-white",
  },
  {
    value: "medium",
    label: "Medium",
    emoji: "🟡",
    description: "Moderate activity level",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-100 dark:border-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    activeBg: "bg-amber-500",
    activeBorder: "border-amber-500",
    activeText: "text-white",
  },
  {
    value: "high",
    label: "High",
    emoji: "🔴",
    description: "Peak production — high demand",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-100 dark:border-red-900/30",
    text: "text-red-700 dark:text-red-400",
    activeBg: "bg-red-500",
    activeBorder: "border-red-500",
    activeText: "text-white",
  },
];

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function FactoryHomeClient({ employeeName, currentPressure }: FactoryHomeClientProps) {
  const [selected, setSelected] = useState<PressureLevel | null>(currentPressure?.level ?? null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(currentPressure?.updated_at ?? null);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [tick, setTick] = useState(0);

  // Refresh "X min ago" every minute
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Hourly reminder: show alert if not updated in the last hour
  useEffect(() => {
    function check() {
      if (!lastUpdated) { setShowReminder(true); return; }
      const age = Date.now() - new Date(lastUpdated).getTime();
      setShowReminder(age > 60 * 60 * 1000);
    }
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  function handleSelect(level: PressureLevel) {
    setErrorMsg(null);
    setSaved(false);
    startSaving(async () => {
      const { error } = await updateFactoryPressureAction(level);
      if (error) { setErrorMsg(error); return; }
      setSelected(level);
      const now = new Date().toISOString();
      setLastUpdated(now);
      setSaved(true);
      setShowReminder(false);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : "Good afternoon";

  return (
    <div className="space-y-6 pb-8" dir="ltr">
      {/* Header */}
      <div
        className="rounded-2xl border p-6 relative overflow-hidden"
        style={{ background: "hsl(var(--n-dark))" }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 90% 10%, hsl(var(--n-gold)) 0%, transparent 70%)",
          }}
        />
        <p className="text-sm font-medium" style={{ color: "rgba(250,250,247,0.55)" }}>
          {greeting},
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: "hsl(var(--n-ivory))" }}>
          {employeeName}
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(250,250,247,0.50)" }}>
          Factory Operations Dashboard
        </p>

        {/* Last updated */}
        {lastUpdated && (
          <div className="mt-4 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" style={{ color: "rgba(250,250,247,0.45)" }} />
            <span className="text-xs" style={{ color: "rgba(250,250,247,0.45)" }}>
              Last update: {formatRelativeTime(lastUpdated)}
            </span>
          </div>
        )}
      </div>

      {/* Hourly reminder */}
      {showReminder && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3.5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Pressure update required
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {lastUpdated
                ? "It's been over an hour since the last update. Please set the current pressure level."
                : "No pressure level has been set yet. Please select the current level below."}
            </p>
          </div>
        </div>
      )}

      {/* Success feedback */}
      {saved && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Pressure level updated successfully
          </p>
        </div>
      )}

      {/* Pressure selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Factory Pressure Level</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Select the current operational pressure level. This is visible to all other teams.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-4">
          {LEVELS.map((lvl) => {
            const isActive = selected === lvl.value;
            return (
              <button
                key={lvl.value}
                onClick={() => handleSelect(lvl.value)}
                disabled={saving}
                className={cn(
                  "group rounded-2xl border-2 p-5 text-center transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-lg",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0",
                  isActive
                    ? cn(lvl.activeBg, lvl.activeBorder, "shadow-md scale-[1.02]")
                    : cn(lvl.bg, lvl.border, "hover:border-current")
                )}
              >
                <div className="text-3xl mb-3 leading-none">{lvl.emoji}</div>
                <p className={cn("text-base font-bold mb-1", isActive ? lvl.activeText : lvl.text)}>
                  {lvl.label}
                </p>
                <p className={cn("text-xs leading-snug", isActive ? "opacity-80 text-white" : "text-muted-foreground")}>
                  {lvl.description}
                </p>
                {isActive && (
                  <div className="mt-3 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse" />
                    <span className="text-[11px] text-white opacity-80 font-medium">Active</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Info note */}
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3.5 text-xs text-muted-foreground leading-relaxed">
        <strong className="font-semibold text-foreground">Note:</strong> The pressure level you set
        here is displayed to all teams in the platform so they can coordinate accordingly.
        Please update it at least once per hour.
      </div>
    </div>
  );
}
