"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cancelMeetingAction } from "@/app/(dashboard)/dashboard/meetings/actions";

export function CancelMeetingButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const { error: serverError } = await cancelMeetingAction(meetingId);
      if (serverError) {
        setError(serverError);
        setOpen(false);
      } else {
        router.push("/dashboard/meetings");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <XCircle className="h-4 w-4 me-1" />
        إلغاء الاجتماع
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد إلغاء الاجتماع</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من إلغاء هذا الاجتماع؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              تراجع
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending ? "جاري الإلغاء…" : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
