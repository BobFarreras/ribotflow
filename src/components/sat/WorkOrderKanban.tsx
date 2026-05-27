/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderKanban.tsx
 * Description: Professional Kanban board with local state (persists moves
 *              instantly), collapsible columns, and per-column scroll.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkOrder } from "@/types/sat";
import { updateWorkOrderStatusAction } from "@/actions/sat/updateStatus";
import { WorkOrderPriorityBadge } from "./WorkOrderPriorityBadge";
import { CategoryIcon } from "./CategoryIcon";
import { GripVertical, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

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
  { key: "pending", label: "Pendent", short: "P", color: "#ca8a04" },
  { key: "assigned", label: "Assignada", short: "A", color: "#3b82f6" },
  { key: "scheduled", label: "Programada", short: "Pr", color: "#8b5cf6" },
  { key: "in_progress", label: "En curs", short: "C", color: "#10b981" },
  { key: "paused", label: "Pausada", short: "Pa", color: "#6b7280" },
  { key: "completed", label: "Completada", short: "Co", color: "#14b8a6" },
  { key: "closed", label: "Tancada", short: "T", color: "#6366f1" },
  { key: "cancelled", label: "Cancel·lada", short: "X", color: "#ef4444" },
];

export function WorkOrderKanban({ orders: initialOrders }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<KanbanOrder[]>(initialOrders);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  // Keep local state in sync when prop changes (e.g. filter changes)
  useEffect(() => {
    setItems(initialOrders);
  }, [initialOrders]);

  // Sync top scrollbar with main scroll
  useEffect(() => {
    const main = scrollRef.current;
    const top = topScrollRef.current;
    if (!main || !top) return;

    const onMainScroll = () => {
      top.scrollLeft = main.scrollLeft;
    };
    const onTopScroll = () => {
      main.scrollLeft = top.scrollLeft;
    };

    main.addEventListener("scroll", onMainScroll);
    top.addEventListener("scroll", onTopScroll);
    return () => {
      main.removeEventListener("scroll", onMainScroll);
      top.removeEventListener("scroll", onTopScroll);
    };
  }, []);

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

      const item = items.find((o) => o.workOrder.id === orderId);
      if (!item || item.workOrder.status === newStatus) return;

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
        router.refresh();
      } catch (err) {
        console.error("[Kanban] Status update failed:", err);
        // Revert
        setItems((prev) =>
          prev.map((o) =>
            o.workOrder.id === orderId
              ? { ...o, workOrder: { ...o.workOrder, status: item.workOrder.status } }
              : o
          )
        );
      }
    },
    [items, router]
  );

  const toggleColumn = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Show all columns that have items + always-visible workflow columns
  const visibleColumns = COLUMNS.filter(
    (col) => items.some((o) => o.workOrder.status === col.key) ||
      ["pending", "assigned", "in_progress", "completed"].includes(col.key)
  );

  // Calculate total scroll width for top scrollbar
  const columnWidth = 280;
  const collapsedWidth = 48;
  const totalWidth = visibleColumns.reduce(
    (sum, col) => sum + (collapsed.has(col.key) ? collapsedWidth : columnWidth),
    0
  );

  return (
    <div className="flex h-full flex-col">
      {/* Top scrollbar track */}
      <div
        ref={topScrollRef}
        className="shrink-0 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin", scrollbarGutter: "stable" }}
      >
        <div style={{ width: totalWidth, height: 1 }} />
      </div>

      {/* Board */}
      <div
        ref={scrollRef}
        className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2"
      >
        {visibleColumns.map((col) => {
          const colOrders = items.filter((o) => o.workOrder.status === col.key);
          const isDragOver = dragOverColumn === col.key;
          const isCollapsed = collapsed.has(col.key);

          if (isCollapsed) {
            return (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                className={`flex h-full w-12 shrink-0 flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 transition-colors hover:border-[var(--border-strong)] ${
                  isDragOver ? "border-[var(--module-sat)] bg-[var(--module-sat)]/5" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
                onDragLeave={() => setDragOverColumn(null)}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: col.color }}
                >
                  {col.short}
                </span>
                <span
                  className="text-xs font-semibold [writing-mode:vertical-lr]"
                  style={{ color: col.color }}
                >
                  {col.label}
                </span>
                <span className="rounded-full bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                  {colOrders.length}
                </span>
                <ChevronRight className="mt-auto h-4 w-4 text-[var(--text-muted)]" />
              </button>
            );
          }

          return (
            <div
              key={col.key}
              className={`flex h-full w-[280px] shrink-0 flex-col rounded-xl border transition-colors ${
                isDragOver
                  ? "border-[var(--module-sat)] bg-[var(--module-sat)]/5"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDrop={(e) => handleDrop(e, col.key)}
              onDragLeave={() => setDragOverColumn(null)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-sm font-semibold" style={{ color: col.color }}>
                    {col.label}
                  </span>
                  <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                    {colOrders.length}
                  </span>
                </div>
                <button
                  onClick={() => toggleColumn(col.key)}
                  className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  title="Plegar columna"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Cards — scrollable */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {colOrders.map((item) => (
                  <div
                    key={item.workOrder.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.workOrder.id)}
                    onDragEnd={handleDragEnd}
                    className={`group cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 shadow-sm transition-all active:cursor-grabbing ${
                      draggingId === item.workOrder.id
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
                            slug={item.category.slug}
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
                ))}

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
    </div>
  );
}
