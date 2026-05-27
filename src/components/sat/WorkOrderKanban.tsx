/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderKanban.tsx
 * Description: Kanban board view with drag & drop between status columns.
 *              Uses native HTML5 drag & drop API.
 */

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkOrder } from "@/types/sat";
import { updateWorkOrderStatusAction } from "@/actions/sat/updateStatus";
import { WorkOrderPriorityBadge } from "./WorkOrderPriorityBadge";
import { CategoryIcon } from "./CategoryIcon";
import { Phone, MapPin, Calendar, GripVertical } from "lucide-react";

interface KanbanOrder {
  workOrder: WorkOrder;
  client: { id: string; name: string; phone: string | null; address: string | null };
  category: { id: string; name: string; slug: string; color: string | null };
  technician: { id: string; name: string } | null;
}

interface Props {
  orders: KanbanOrder[];
}

const COLUMNS = [
  { key: "pending", label: "Pendent", color: "#6b7280" },
  { key: "assigned", label: "Assignada", color: "#3b82f6" },
  { key: "in_progress", label: "En curs", color: "#f59e0b" },
  { key: "paused", label: "Pausada", color: "#eab308" },
  { key: "completed", label: "Completada", color: "#22c55e" },
  { key: "closed", label: "Tancada", color: "#14b8a6" },
  { key: "cancelled", label: "Cancel·lada", color: "#ef4444" },
];

export function WorkOrderKanban({ orders }: Props) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();
      const orderId = e.dataTransfer.getData("text/plain");
      setDragOverColumn(null);
      setDraggingId(null);

      if (!orderId) return;

      const item = orders.find((o) => o.workOrder.id === orderId);
      if (!item || item.workOrder.status === newStatus) return;

      // Optimistic UI: update locally first
      item.workOrder.status = newStatus as any;

      // Call server action to persist
      try {
        const result = await updateWorkOrderStatusAction({
          workOrderId: orderId,
          status: newStatus as any,
        });
        if (!result.success) throw new Error(result.error);
        router.refresh();
      } catch (err) {
        console.error("[Kanban] Status update failed:", err);
        // Revert on error would need proper state management
      }
    },
    [orders, router]
  );

  // Group orders by status
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = orders.filter((o) => o.workOrder.status === col.key);
    return acc;
  }, {} as Record<string, KanbanOrder[]>);

  // Only show columns that have orders OR are standard workflow columns
  const visibleColumns = COLUMNS.filter(
    (col) => grouped[col.key].length > 0 || ["pending", "assigned", "in_progress", "completed"].includes(col.key)
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {visibleColumns.map((col) => {
        const colOrders = grouped[col.key];
        const isDragOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className={`flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border-2 transition-colors ${
              isDragOver
                ? "border-[var(--module-sat)] bg-[var(--module-sat)]/5"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            {/* Column header */}
            <div
              className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
              style={{ backgroundColor: `${col.color}12` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-sm font-semibold" style={{ color: col.color }}>
                  {col.label}
                </span>
              </div>
              <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                {colOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-2">
              {colOrders.map((item) => (
                <div
                  key={item.workOrder.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.workOrder.id)}
                  onDragEnd={handleDragEnd}
                  className={`group cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 shadow-sm transition-all active:cursor-grabbing ${
                    draggingId === item.workOrder.id
                      ? "opacity-50 rotate-2"
                      : "hover:border-[var(--module-sat)]/30 hover:shadow-md hover:-translate-y-0.5"
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
                          slug={item.category.slug}
                          color={item.category.color}
                          size={12}
                        />
                        <span className="truncate">{item.client.name}</span>
                      </div>
                      {item.client.phone && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Phone className="h-3 w-3" />
                          {item.client.phone}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        {item.technician ? (
                          <span>👤 {item.technician.name}</span>
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
              ))}

              {/* Drop zone hint */}
              {isDragOver && colOrders.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[var(--module-sat)]/30 py-8 text-sm text-[var(--text-muted)]">
                  Deixa aquí
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
