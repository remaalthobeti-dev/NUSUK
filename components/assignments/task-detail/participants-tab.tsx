"use client";

import { useTransition } from "react";
import { User, Crown, Check, X, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { respondToRequestAction } from "@/app/(dashboard)/dashboard/assignments/[taskId]/actions";
import type { TaskParticipantEntry, TaskRequestEntry } from "@/lib/data/task-detail";

interface Props {
  taskId: string;
  participants: TaskParticipantEntry[];
  pendingRequests: TaskRequestEntry[];
  currentEmployeeId: string;
  assigneeId: string | null;
}

export function ParticipantsTab({
  taskId,
  participants,
  pendingRequests,
  currentEmployeeId,
  assigneeId,
}: Props) {
  const hasAnything = participants.length > 0 || pendingRequests.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Active participants ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">المشاركون الحاليون</h2>

        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا يوجد مشاركون حتى الآن.</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                name={p.employee?.full_name ?? "—"}
                jobTitle={p.employee?.job_title ?? null}
                joinedAt={p.joined_at}
                isCurrentUser={p.employee_id === currentEmployeeId}
                isAssignee={p.employee_id === assigneeId}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ── Pending requests ── */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            طلبات بانتظار الرد
          </h2>
          <ul className="space-y-3">
            {pendingRequests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                isMyRequest={req.requestee?.id === currentEmployeeId}
              />
            ))}
          </ul>
        </section>
      )}

      {!hasAnything && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          لا يوجد مشاركون أو طلبات معلقة.
        </p>
      )}
    </div>
  );
}

function ParticipantRow({
  name,
  jobTitle,
  joinedAt,
  isCurrentUser,
  isAssignee,
}: {
  name: string;
  jobTitle: string | null;
  joinedAt: string;
  isCurrentUser: boolean;
  isAssignee: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        {isAssignee ? (
          <Crown className="h-4 w-4 text-amber-500" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {name}
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground ms-1">(أنت)</span>
          )}
        </p>
        {jobTitle && <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>}
      </div>
      <div className="text-end shrink-0 space-y-1">
        {isAssignee && (
          <Badge className="text-xs border-0 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            المُسند إليه
          </Badge>
        )}
        <p className="text-xs text-muted-foreground">
          انضم {new Date(joinedAt).toLocaleDateString("ar-SA")}
        </p>
      </div>
    </li>
  );
}

function RequestRow({
  request,
  isMyRequest,
}: {
  request: TaskRequestEntry;
  isMyRequest: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function respond(response: "accepted" | "rejected") {
    startTransition(async () => {
      await respondToRequestAction(request.id, response);
    });
  }

  const typeLabel = request.request_type === "collaboration" ? "مشاركة" : "مراجعة";

  return (
    <li className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{request.requester?.full_name ?? "—"}</span>
          <span className="text-muted-foreground mx-1">طلب</span>
          <span className="font-medium">{typeLabel}</span>
          <span className="text-muted-foreground mx-1">من</span>
          <span className={cn("font-medium", isMyRequest && "text-primary")}>
            {request.requestee?.full_name ?? "—"}
            {isMyRequest && " (أنت)"}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(request.created_at).toLocaleDateString("ar-SA")}
        </p>
      </div>

      {isMyRequest && (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 gap-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={isPending}
            onClick={() => respond("accepted")}
          >
            <Check className="h-3.5 w-3.5" />
            قبول
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            disabled={isPending}
            onClick={() => respond("rejected")}
          >
            <X className="h-3.5 w-3.5" />
            رفض
          </Button>
        </div>
      )}
    </li>
  );
}
