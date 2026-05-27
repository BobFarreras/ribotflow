/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderPriorityBadge.tsx
 * Description: Refined priority badge matching status badge style.
 */

"use client";

import { useTranslations } from "next-intl";
import type { WorkOrderPriority } from "@/types/sat";

interface Props {
  priority: WorkOrderPriority;
}

const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  low: "#6b7280",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

export function WorkOrderPriorityBadge({ priority }: Props) {
  const t = useTranslations("sat.workOrder");
  const color = PRIORITY_COLORS[priority];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{
        color,
        backgroundColor: `${color}14`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {t(`list.priority.${priority}`)}
    </span>
  );
}
