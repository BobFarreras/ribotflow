/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderKanban/KanbanColumn.tsx
 * Description: Single Kanban column (expanded or collapsed).
 *              Drop target behaviour is owned by the parent — this component
 *              just exposes the drag/drop callbacks.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import type { KanbanColumn } from "./constants";
import type { KanbanOrder } from "./types";

interface KanbanColumnProps {
  column: KanbanColumn;
  orders: KanbanOrder[];
  collapsed: boolean;
  isDragOver: boolean;
  isValidTarget: boolean;
  draggingId: string | null;
  onToggleCollapse: () => void;
  onDragOver: (e: React.DragEvent, status: string) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onDragLeave: () => void;
  onCardDragStart: (e: React.DragEvent, orderId: string) => void;
  onCardDragEnd: () => void;
}

export function KanbanColumn({
  column,
  orders,
  collapsed,
  isDragOver,
  isValidTarget,
  draggingId,
  onToggleCollapse,
  onDragOver,
  onDrop,
  onDragLeave,
  onCardDragStart,
  onCardDragEnd,
}: KanbanColumnProps) {
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={`flex h-full w-12 shrink-0 flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 transition-colors hover:border-[var(--border-strong)] ${
          isDragOver && isValidTarget ? "border-[var(--module-sat)] bg-[var(--module-sat)]/5" : ""
        } ${draggingId && !isValidTarget ? "opacity-60" : ""}`}
        onDragOver={(e) => onDragOver(e, column.key)}
        onDrop={(e) => onDrop(e, column.key)}
        onDragLeave={onDragLeave}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: column.color }}
        >
          {column.short}
        </span>
        <span
          className="text-xs font-semibold [writing-mode:vertical-lr]"
          style={{ color: column.color }}
        >
          {column.label}
        </span>
        <span className="rounded-full bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          {orders.length}
        </span>
        <ChevronRight className="mt-auto h-4 w-4 text-[var(--text-muted)]" />
      </button>
    );
  }

  return (
    <div
      className={`flex h-full w-[280px] shrink-0 flex-col rounded-xl border transition-colors ${
        isDragOver && isValidTarget
          ? "border-[var(--module-sat)] bg-[var(--module-sat)]/5"
          : draggingId && !isValidTarget
          ? "border-red-300/30 bg-red-500/[0.02]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
      onDragOver={(e) => onDragOver(e, column.key)}
      onDrop={(e) => onDrop(e, column.key)}
      onDragLeave={onDragLeave}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-sm font-semibold" style={{ color: column.color }}>
            {column.label}
          </span>
          <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
            {orders.length}
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)]"
          title="Plegar columna"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Cards — scrollable */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {orders.map((item) => (
          <KanbanCard
            key={item.workOrder.id}
            item={item}
            isDragging={draggingId === item.workOrder.id}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
          />
        ))}

        {isDragOver && isValidTarget && orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[var(--module-sat)]/30 py-8 text-sm text-[var(--text-muted)]">
            Deixa aquí
          </div>
        )}
      </div>
    </div>
  );
}
