"use client";

import { useState, useTransition } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startMeetingAction, endMeetingAction } from "@/app/(dashboard)/dashboard/meetings/actions";
import type { MeetingStatus, UserRole } from "@/types/database";

interface MeetingStatusControlsProps {
  meetingId: string;
  status: MeetingStatus;
  organizerId: string;
  currentEmployeeId: string;
  currentRole: UserRole;
}

export function MeetingStatusControls({
  meetingId,
  status,
  organizerId,
  currentEmployeeId,
  currentRole,
}: MeetingStatusControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isOrganizer = currentEmployeeId === organizerId;
  const isAdmin = currentRole === "super_admin";
  const canControl = isOrganizer || isAdmin;

  if (!canControl) return null;
  if (status !== "scheduled" && status !== "in_progress") return null;

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const { error: err } = await startMeetingAction(meetingId);
      if (err) setError(err);
    });
  }

  function handleEnd() {
    setError(null);
    startTransition(async () => {
      const { error: err } = await endMeetingAction(meetingId);
      if (err) setError(err);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "scheduled" && (
        <Button
          onClick={handleStart}
          disabled={isPending}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          بدء الاجتماع
        </Button>
      )}

      {status === "in_progress" && (
        <Button
          onClick={handleEnd}
          disabled={isPending}
          size="sm"
          variant="outline"
          className="border-slate-300 gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4 fill-current" />
          )}
          إنهاء الاجتماع
        </Button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
