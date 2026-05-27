/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderStatusBadge.tsx
 * Description: Refined status badge with subtle background dot indicator.
 *              Inspired by Linear / Attio — no borders, no uppercase.
 */

"use client";

import { useTranslations } from "next-intl";
import type { WorkOrderStatus } from "@/types/sat";

interface Props {
  status: WorkOrderStatus;
  size?: "sm" | "md";
}

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  pending: "#ca8a04",
  assigned: "#3b82f6",
  scheduled: "#8b5cf6",
  in_progress: "#10b981",
  paused: "#6b7280",
  completed: "#14b8a6",
  closed: "#6366f1",
  cancelled: "#ef4444",
  waiting_parts: "#f97316",
  waiting_client: "#f59e0b",
};

export function WorkOrderStatusBadge({ status, size = "sm" }: Props) {
  const t = useTranslations("sat.workOrder");
  const color = STATUS_COLORS[status];

  const sizeClasses = size === "md"
    ? "px-2 py-1 text-xs"
    : "px-1.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium ${sizeClasses}`}
      style={{
        color,
        backgroundColor: `${color}14`, // ~8% opacity
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {t(`list.status.${status}`)}
    </span>
  );
}
