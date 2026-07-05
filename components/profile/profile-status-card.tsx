"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, STATUS_OPTIONS } from "@/components/dashboard/status-config";
import { MyStatusDialog } from "@/components/shared/my-status-dialog";
import { useMyPresence } from "@/hooks/use-my-presence";
import type { AvailabilityStatus } from "@/types/database";

interface ProfileStatusCardProps {
  currentStatus: AvailabilityStatus;
  currentNote: string | null;
}

export function ProfileStatusCard({ currentStatus, currentNote }: ProfileStatusCardProps) {
  const [open, setOpen] = useState(false);
  const { presence, refetch } = useMyPresence();

  const liveStatus = presence?.availability_status ?? currentStatus;
  const liveNote = presence?.notes ?? currentNote;
  const cfg = STATUS_CONFIG[liveStatus];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            حالة التواجد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current status */}
          <div className={cn("flex items-center gap-3 rounded-xl border p-4", cfg.badgeClass)}>
            <span
              className={cn(
                "w-4 h-4 rounded-full shrink-0",
                cfg.dotClass,
                liveStatus === "available" && "animate-pulse"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold", cfg.textClass)}>{cfg.label}</p>
              {liveNote && (
                <p className="text-xs text-muted-foreground mt-0.5">{liveNote}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 bg-background"
              onClick={() => setOpen(true)}
            >
              <Activity className="h-3.5 w-3.5 me-1.5" />
              تغيير الحالة
            </Button>
          </div>

          {/* All statuses reference */}
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((s) => {
              const c = STATUS_CONFIG[s];
              const isActive = liveStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOpen(true)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-all",
                    isActive
                      ? `${c.badgeClass} border-current`
                      : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                  )}
                >
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dotClass)} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <MyStatusDialog
        open={open}
        onOpenChange={setOpen}
        currentStatus={liveStatus}
        currentNote={liveNote}
        onSuccess={refetch}
      />
    </>
  );
}
