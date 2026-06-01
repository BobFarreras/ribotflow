/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderActions.tsx
 * Description: Compact horizontal action buttons for work order status transitions.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { updateWorkOrderStatusAction } from "@/actions/sat/updateStatus";
import type { WorkOrderStatus } from "@/types/sat";
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Lock } from "lucide-react";

interface Props {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
}

const TRANSITIONS: Record<
  WorkOrderStatus,
  { status: WorkOrderStatus; label: string; icon: typeof Play; variant: "primary" | "danger" | "neutral" }[]
> = {
  pending: [
    { status: "in_progress", label: "detail.actions.start", icon: Play, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
  assigned: [
    { status: "in_progress", label: "detail.actions.start", icon: Play, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
  scheduled: [
    { status: "in_progress", label: "detail.actions.start", icon: Play, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
  in_progress: [
    { status: "paused", label: "detail.actions.pause", icon: Pause, variant: "neutral" },
    { status: "completed", label: "detail.actions.complete", icon: CheckCircle, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
  paused: [
    { status: "in_progress", label: "detail.actions.resume", icon: RotateCcw, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
  completed: [
    { status: "closed", label: "detail.actions.close", icon: Lock, variant: "primary" },
    { status: "in_progress", label: "detail.actions.reopen", icon: RotateCcw, variant: "neutral" },
  ],
  closed: [
    { status: "in_progress", label: "detail.actions.reopen", icon: RotateCcw, variant: "neutral" },
  ],
  cancelled: [
    { status: "pending", label: "detail.actions.restore", icon: RotateCcw, variant: "primary" },
  ],
  waiting_parts: [
    { status: "in_progress", label: "detail.actions.resume", icon: RotateCcw, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
  waiting_client: [
    { status: "in_progress", label: "detail.actions.resume", icon: RotateCcw, variant: "primary" },
    { status: "cancelled", label: "detail.actions.cancel", icon: XCircle, variant: "danger" },
  ],
};

const variantClasses = {
  primary: "bg-[var(--module-sat)] text-white hover:opacity-90",
  danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  neutral: "bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--surface-hover)]",
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
    return <p className="text-xs text-[var(--text-muted)]">No hi ha accions disponibles</p>;
  }

  return (
    <div className="space-y-1.5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {transitions.map(({ status, label, icon: Icon, variant }) => (
          <button
            key={status}
            onClick={() => handleTransition(status)}
            disabled={isLoading !== null}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${variantClasses[variant]}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{t(label)}</span>
            {isLoading === status && (
              <span className="ml-0.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
