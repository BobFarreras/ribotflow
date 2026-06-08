/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderKanban/KanbanCard.tsx
 * Description: Single draggable card displayed inside a Kanban column.
 */

"use client";

import Link from "next/link";
import { Calendar, GripVertical } from "lucide-react";
import { WorkOrderPriorityBadge } from "../../shared/WorkOrderPriorityBadge";
import { CategoryIcon } from "../../shared/CategoryIcon";
import type { KanbanOrder } from "./types";

interface KanbanCardProps {
  item: KanbanOrder;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, orderId: string) => void;
  onDragEnd: () => void;
}

export function KanbanCard({ item, isDragging, onDragStart, onDragEnd }: KanbanCardProps) {
  return (
    <div
      data-kanban-card
      draggable
      onDragStart={(e) => onDragStart(e, item.workOrder.id)}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 shadow-sm transition-all active:cursor-grabbing ${
        isDragging
          ? "opacity-40 rotate-1"
          : "hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {item.workOrder.number}
            </span>
            <WorkOrderPriorityBadge priority={item.workOrder.priority} />
          </div>
          <Link
            href={`/sat/${item.workOrder.id}`}
            className="mt-0.5 block text-sm font-medium text-[var(--text)] hover:text-[var(--module-sat)]"
            onClick={(e) => e.stopPropagation()}
          >
            {item.workOrder.title}
          </Link>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <CategoryIcon
              slug={item.category.icon ?? item.category.slug}
              color={item.category.color}
              size={12}
            />
            <span className="truncate">{item.client.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            {item.technician ? (
              <span>{item.technician.name}</span>
            ) : (
              <span className="italic opacity-60">Sense assignar</span>
            )}
            {item.workOrder.scheduledDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.workOrder.scheduledDate).toLocaleDateString("ca-ES", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
