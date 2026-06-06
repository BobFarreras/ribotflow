/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/field/FieldStatusActions.tsx
 * Description: One/two-tap status-change buttons for a work order
 *              owned by the signed-in technician. The allowed next
 *              states are derived from the current status; the actual
 *              ownership check happens server-side in the action.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Play, Pause, Check, Loader2, AlertTriangle, Hourglass } from "lucide-react";
import { updateMyWorkOrderStatusAction } from "@/actions/sat/field/updateMyWorkOrderStatus";
import type { WorkOrderStatus } from "@/types/sat";

interface Props {
  workOrderId: string;
  status: WorkOrderStatus;
}

interface NextAction {
  status: WorkOrderStatus;
  kind: "primary" | "secondary";
  icon: React.ReactNode;
}

function nextActionsFor(status: WorkOrderStatus): NextAction[] {
  switch (status) {
    case "assigned":
    case "scheduled":
    case "pending":
      return [{ status: "in_progress", kind: "primary", icon: <Play className="h-4 w-4" /> }];
    case "in_progress":
      return [
        { status: "paused", kind: "secondary", icon: <Pause className="h-4 w-4" /> },
        { status: "completed", kind: "primary", icon: <Check className="h-4 w-4" /> },
      ];
    case "paused":
      return [
        { status: "in_progress", kind: "primary", icon: <Play className="h-4 w-4" /> },
        { status: "completed", kind: "secondary", icon: <Check className="h-4 w-4" /> },
      ];
    case "waiting_parts":
    case "waiting_client":
      return [{ status: "in_progress", kind: "primary", icon: <Play className="h-4 w-4" /> }];
    case "completed":
    case "closed":
    case "cancelled":
      return [];
    default:
      return [];
  }
}

export function FieldStatusActions({ workOrderId, status }: Props) {
  const t = useTranslations("sat.field.actions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyStatus, setBusyStatus] = useState<WorkOrderStatus | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const actions = nextActionsFor(status);

  if (actions.length === 0) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-[color:var(--text-muted)]">
        <Hourglass className="h-3.5 w-3.5" />
        {t("closed")}
      </p>
    );
  }

  const onChange = (next: WorkOrderStatus) => {
    setBusyStatus(next);
    setFeedback(null);
    startTransition(async () => {
      const r = await updateMyWorkOrderStatusAction({
        workOrderId,
        status: next,
      });
      setBusyStatus(null);
      if (r.success) {
        setFeedback({ kind: "ok", msg: t("success") });
        router.refresh();
      } else {
        setFeedback({ kind: "err", msg: mapError(r.error ?? "", t) });
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            onClick={() => onChange(a.status)}
            disabled={isPending}
            className={
              "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-50 " +
              (a.kind === "primary"
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-90"
                : "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-2)]")
            }
          >
            {isPending && busyStatus === a.status ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              a.icon
            )}
            {t(a.status)}
          </button>
        ))}
      </div>
      {feedback && (
        <p
          className={
            "inline-flex items-center gap-1.5 text-xs " +
            (feedback.kind === "ok" ? "text-[color:var(--success)]" : "text-[color:var(--danger)]")
          }
        >
          {feedback.kind === "err" && <AlertTriangle className="h-3.5 w-3.5" />}
          {feedback.msg}
        </p>
      )}
    </div>
  );
}

function mapError(code: string, t: (k: string) => string): string {
  if (code === "NOT_ASSIGNED") return t("errors.notAssigned");
  if (code === "NOT_FOUND") return t("errors.notFound");
  return t("errors.generic");
}
