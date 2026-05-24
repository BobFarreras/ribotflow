/**
 * Creation/modification date: 24/05/2026
 * Path: src/components/sat/WorkOrderActions.tsx
 * Description: Client component for work order status transitions.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { updateWorkOrderStatusAction } from "@/actions/sat/updateStatus";
import type { WorkOrderStatus } from "@/types/sat";
import { Play, Pause, RotateCcw, CheckCircle, XCircle } from "lucide-react";

interface Props {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
}

const TRANSITIONS: Record<
  WorkOrderStatus,
  { status: WorkOrderStatus; label: string; icon: typeof Play }[]
> = {
  pending: [
    { status: "in_progress", label: "detail.actions.start", icon: Play },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle },
  ],
  assigned: [
    { status: "in_progress", label: "detail.actions.start", icon: Play },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle },
  ],
  in_progress: [
    { status: "paused", label: "detail.actions.pause", icon: Pause },
    { status: "completed", label: "detail.actions.complete", icon: CheckCircle },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle },
  ],
  paused: [
    { status: "in_progress", label: "detail.actions.resume", icon: RotateCcw },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle },
  ],
  completed: [
    { status: "closed", label: "detail.actions.complete", icon: CheckCircle },
    { status: "in_progress", label: "detail.actions.start", icon: Play },
  ],
  closed: [],
  cancelled: [{ status: "pending", label: "detail.actions.start", icon: RotateCcw }],
};

export function WorkOrderActions({ workOrderId, currentStatus }: Props) {
  const t = useTranslations("sat.workOrder");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<WorkOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTransition(newStatus: WorkOrderStatus) {
    setIsLoading(newStatus);
    setError(null);

    const result = await updateWorkOrderStatusAction({
      workOrderId,
      status: newStatus,
      reason: `Transitioned to ${newStatus} via UI`,
    });

    setIsLoading(null);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Error");
    }
  }

  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No hi ha accions disponibles</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {transitions.map(({ status, label, icon: Icon }) => (
        <button
          key={status}
          onClick={() => handleTransition(status)}
          disabled={isLoading !== null}
          className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)] disabled:opacity-50"
        >
          <Icon className="h-4 w-4 text-[var(--module-sat)]" />
          <span>{t(label)}</span>
          {isLoading === status && (
            <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[var(--module-sat)] border-t-transparent" />
          )}
        </button>
      ))}
    </div>
  );
}
