/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderKanban.tsx
 * Description: Professional Kanban board with local state (persists moves
 *              instantly), collapsible columns, per-column scroll, and
 *              click-drag horizontal panning.
 *              Orchestrator only. Sub-components/hooks in
 *              ./work-orders/WorkOrderKanban/.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isValidTransition } from "@/lib/constants/statusTransitions";
import { KANBAN_COLUMNS, ALWAYS_VISIBLE_COLUMNS } from "./WorkOrderKanban/constants";
import { KanbanColumn } from "./WorkOrderKanban/KanbanColumn";
import { useKanbanDragDrop } from "./WorkOrderKanban/useKanbanDragDrop";
import { useKanbanPan } from "./WorkOrderKanban/useKanbanPan";
import type { KanbanOrder } from "./WorkOrderKanban/types";

interface Props {
  orders: KanbanOrder[];
}

export function WorkOrderKanban({ orders: initialOrders }: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { ref, isPanning, panHandlers } = useKanbanPan<HTMLDivElement>();
  const {
    items,
    setItems,
    draggingId,
    dragOverColumn,
    setDragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  } = useKanbanDragDrop({
    initialItems: initialOrders,
    onAfterDrop: () => router.refresh(),
  });

  // Keep local state in sync when prop changes (e.g. filter changes)
  useEffect(() => {
    setItems(initialOrders);
  }, [initialOrders, setItems]);

  const toggleColumn = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Show all columns that have items + always-visible workflow columns
  const visibleColumns = KANBAN_COLUMNS.filter(
    (col) =>
      items.some((o) => o.workOrder.status === col.key) || ALWAYS_VISIBLE_COLUMNS.includes(col.key)
  );

  const draggedItem = draggingId ? items.find((o) => o.workOrder.id === draggingId) : null;
  const draggedStatus = draggedItem?.workOrder.status ?? null;

  return (
    <div className="flex h-full flex-col">
      {/* Board */}
      <div
        ref={ref}
        className={`flex flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2 select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        {...panHandlers}
      >
        {visibleColumns.map((col) => {
          const colOrders = items.filter((o) => o.workOrder.status === col.key);
          const isValidTarget = draggedStatus ? isValidTransition(draggedStatus, col.key) : false;

          return (
            <KanbanColumn
              key={col.key}
              column={col}
              orders={colOrders}
              collapsed={collapsed.has(col.key)}
              isDragOver={dragOverColumn === col.key}
              isValidTarget={isValidTarget}
              draggingId={draggingId}
              onToggleCollapse={() => toggleColumn(col.key)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={() => setDragOverColumn(null)}
              onCardDragStart={handleDragStart}
              onCardDragEnd={handleDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}
