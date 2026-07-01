"use client";

import { useState, useTransition } from "react";
import { CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { rsvpAction } from "@/app/(dashboard)/dashboard/meetings/actions";
import type { RsvpResponse } from "@/types/database";

const OPTIONS: Array<{
  value: RsvpResponse;
  label: string;
  Icon: React.ElementType;
  activeClass: string;
}> = [
  { value: "attending", label: "حضور", Icon: CheckCircle, activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { value: "maybe", label: "ربما", Icon: HelpCircle, activeClass: "bg-amber-600 text-white border-amber-600" },
  { value: "not_attending", label: "اعتذار", Icon: XCircle, activeClass: "bg-red-600 text-white border-red-600" },
];

interface RsvpButtonsProps {
  meetingId: string;
  currentResponse: RsvpResponse | null;
}

export function RsvpButtons({ meetingId, currentResponse }: RsvpButtonsProps) {
  const [selected, setSelected] = useState<RsvpResponse | null>(currentResponse);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleRsvp(response: RsvpResponse) {
    if (isPending) return;
    setSelected(response);
    setServerError(null);
    startTransition(async () => {
      const { error } = await rsvpAction(meetingId, response);
      if (error) {
        setServerError(error);
        setSelected(currentResponse);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">هل ستحضر هذا الاجتماع؟</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label, Icon, activeClass }) => {
          const isActive = selected === value;
          return (
            <button
              key={value}
              onClick={() => handleRsvp(value)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all disabled:opacity-60",
                isActive
                  ? activeClass
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
      {serverError && <p className="text-xs text-destructive">{serverError}</p>}
    </div>
  );
}
