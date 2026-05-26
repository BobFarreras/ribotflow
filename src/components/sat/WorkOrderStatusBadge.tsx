/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/WorkOrderStatusBadge.tsx
 * Description: Pure presentational component for a work order status badge.
 *              Eliminates duplication between list and detail pages.
 */

"use client";

import { useTranslations } from "next-intl";
import type { WorkOrderStatus } from "@/types/sat";

interface Props {
  status: WorkOrderStatus;
  size?: "sm" | "md";
}

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-gray-100 text-gray-700 border-gray-200",
  completed: "bg-teal-100 text-teal-700 border-teal-200",
  closed: "bg-purple-100 text-purple-700 border-purple-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  waiting_parts: "bg-orange-100 text-orange-700 border-orange-200",
  waiting_client: "bg-orange-100 text-orange-700 border-orange-200",
};

export function WorkOrderStatusBadge({ status, size = "sm" }: Props) {
  const t = useTranslations("sat.workOrder");

  const sizeClasses = size === "md"
    ? "px-3 py-1 text-xs"
    : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`rounded-full border font-semibold uppercase tracking-wide ${sizeClasses} ${STATUS_STYLES[status]}`}
    >
      {t(`list.status.${status}`)}
    </span>
  );
}
