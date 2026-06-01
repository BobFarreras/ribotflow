/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderKanban/useKanbanDragDrop.ts
 * Description: Encapsulates Kanban drag-and-drop state + handlers.
 *              Returns props ready to spread on the board and per-column targets.
 *              Uses a ref to read the latest items without re-binding handlers.
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { isValidTransition } from "@/lib/constants/statusTransitions";
import { updateWorkOrderStatusAction } from "@/actions/sat/updateStatus";
import type { KanbanOrder } from "./types";

interface UseKanbanDragDropOptions {
  initialItems: KanbanOrder[];
  onAfterDrop?: () => void;
}

export function useKanbanDragDrop({ initialItems, onAfterDrop }: UseKanbanDragDropOptions) {
  const [items, setItems] = useState<KanbanOrder[]>(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Refs for latest state inside event handlers (avoid stale closures)
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggingId(orderId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", orderId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const draggedId = draggingId;
    if (!draggedId) return;
    const item = itemsRef.current.find((o) => o.workOrder.id === draggedId);
    const fromStatus = item?.workOrder.status;
    if (fromStatus && !isValidTransition(fromStatus as any, status as any)) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();
      const orderId = e.dataTransfer.getData("text/plain");
      setDragOverColumn(null);
      setDraggingId(null);

      if (!orderId) {
        console.warn("[Kanban] Drop received but no orderId found in dataTransfer");
        return;
      }

      const item = itemsRef.current.find((o) => o.workOrder.id === orderId);
      if (!item) return;

      const fromStatus = item.workOrder.status;
      if (fromStatus === newStatus) return;

      if (!isValidTransition(fromStatus, newStatus as any)) {
        console.warn(`[Kanban] Invalid transition: ${fromStatus} -> ${newStatus}`);
        return;
      }

      // Optimistic UI: update local state immediately
      setItems((prev) =>
        prev.map((o) =>
          o.workOrder.id === orderId
            ? { ...o, workOrder: { ...o.workOrder, status: newStatus as any } }
            : o
        )
      );

      // Persist server-side
      try {
        const result = await updateWorkOrderStatusAction({
          workOrderId: orderId,
          status: newStatus as any,
        });
        if (!result.success) throw new Error(result.error);
        onAfterDrop?.();
      } catch (err) {
        console.error("[Kanban] Status update failed:", err);
        // Revert
        setItems((prev) =>
          prev.map((o) =>
            o.workOrder.id === orderId
              ? { ...o, workOrder: { ...o.workOrder, status: fromStatus } }
              : o
          )
        );
      }
    },
    [onAfterDrop]
  );

  return {
    items,
    setItems,
    draggingId,
    dragOverColumn,
    setDragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
