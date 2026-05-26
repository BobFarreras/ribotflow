/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/WorkOrderCard.tsx
 * Description: Pure presentational card for a work order in the list view.
 */

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkOrder } from "@/types/sat";
import { WorkOrderStatusBadge } from "./WorkOrderStatusBadge";
import { WorkOrderPriorityBadge } from "./WorkOrderPriorityBadge";

interface Props {
  workOrder: WorkOrder;
  client: { name: string };
  category: { name: string; color: string | null };
  technicianName?: string | null;
}

export function WorkOrderCard({ workOrder, client, category, technicianName }: Props) {
  const t = useTranslations("sat.workOrder");

  return (
    <Link
      href={`/sat/${workOrder.id}`}
      className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {workOrder.number}
          </span>
          <h3 className="mt-0.5 text-sm font-semibold text-[var(--text)]">
            {workOrder.title}
          </h3>
        </div>
        <WorkOrderStatusBadge status={workOrder.status} size="sm" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="truncate max-w-[120px]">{client.name}</span>
        {category.color && (
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        )}
        <span className="truncate">{category.name}</span>
      </div>

      <div className="mt-2 text-xs text-[var(--text-muted)]">
        {technicianName ? `👤 ${technicianName}` : t("detail.unassigned")}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <WorkOrderPriorityBadge priority={workOrder.priority} />
        <span className="text-[10px] text-[var(--text-muted)]">
          {workOrder.scheduledDate
            ? new Date(workOrder.scheduledDate).toLocaleDateString("ca-ES")
            : "—"}
        </span>
      </div>
    </Link>
  );
}
