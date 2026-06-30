"use client";

import { useState } from "react";
import { Inbox, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailableTaskCard } from "./available-task-card";
import { RunningTaskCard } from "./running-task-card";
import type { TaskWithRelations } from "@/lib/data/assignments";

type Tab = "available" | "running";

interface Props {
  availableTasks: TaskWithRelations[];
  runningTasks: TaskWithRelations[];
}

export function AssignmentsClient({ availableTasks, runningTasks }: Props) {
  const [tab, setTab] = useState<Tab>("available");

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "available", label: "الأعمال المتاحة", icon: Inbox, count: availableTasks.length },
    { id: "running", label: "الأعمال الجارية", icon: Cog, count: runningTasks.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span
                className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Available tab */}
      {tab === "available" && (
        availableTasks.length === 0 ? (
          <EmptyState
            icon={Inbox}
            message="لا توجد أعمال متاحة في فريقك حالياً"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTasks.map((task) => (
              <AvailableTaskCard key={task.id} task={task} />
            ))}
          </div>
        )
      )}

      {/* Running tab */}
      {tab === "running" && (
        runningTasks.length === 0 ? (
          <EmptyState
            icon={Cog}
            message="لا توجد أعمال جارية في فريقك حالياً"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {runningTasks.map((task) => (
              <RunningTaskCard key={task.id} task={task} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/20 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
