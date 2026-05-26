/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/WorkOrderPriorityBadge.tsx
 * Description: Pure presentational component for a work order priority badge.
 */

"use client";

import { useTranslations } from "next-intl";
import type { WorkOrderPriority } from "@/types/sat";

interface Props {
  priority: WorkOrderPriority;
}

const PRIORITY_STYLES: Record<WorkOrderPriority, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
};

export function WorkOrderPriorityBadge({ priority }: Props) {
  const t = useTranslations("sat.workOrder");

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[priority]}`}
    >
      {t(`list.priority.${priority}`)}
    </span>
  );
}
