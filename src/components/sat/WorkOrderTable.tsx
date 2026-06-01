/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderTable.tsx
 * Description: Sortable table view for work orders with all key columns.
 *              The table body scrolls independently; header stays fixed.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkOrder } from "@/types/sat";
import { WorkOrderStatusBadge } from "./WorkOrderStatusBadge";
import { WorkOrderPriorityBadge } from "./WorkOrderPriorityBadge";
import { CategoryIcon } from "./CategoryIcon";
import { ArrowUpDown, ArrowUp, ArrowDown, Phone, MapPin } from "lucide-react";

interface TableOrder {
  workOrder: WorkOrder;
  client: { id: string; name: string; phone: string | null };
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null };
  technician: { id: string; name: string } | null;
}

type SortKey = "number" | "title" | "client" | "status" | "priority" | "category" | "scheduledDate" | "distance";
type SortDir = "asc" | "desc";

interface Props {
  orders: TableOrder[];
}

export function WorkOrderTable({ orders }: Props) {
  const t = useTranslations("sat.workOrder");
  const [sortKey, setSortKey] = useState<SortKey>("scheduledDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      let valA: string | number | Date | null;
      let valB: string | number | Date | null;

      switch (sortKey) {
        case "number":
          valA = a.workOrder.number;
          valB = b.workOrder.number;
          break;
        case "title":
          valA = a.workOrder.title;
          valB = b.workOrder.title;
          break;
        case "client":
          valA = a.client.name;
          valB = b.client.name;
          break;
        case "status":
          valA = a.workOrder.status;
          valB = b.workOrder.status;
          break;
        case "priority": {
          const pMap = { low: 1, medium: 2, high: 3, urgent: 4 };
          valA = pMap[a.workOrder.priority] ?? 0;
          valB = pMap[b.workOrder.priority] ?? 0;
          break;
        }
        case "category":
          valA = a.category.name;
          valB = b.category.name;
          break;
        case "scheduledDate":
          valA = a.workOrder.scheduledDate ? new Date(a.workOrder.scheduledDate).getTime() : 0;
          valB = b.workOrder.scheduledDate ? new Date(b.workOrder.scheduledDate).getTime() : 0;
          break;
        case "distance":
          valA = parseFloat(a.workOrder.travelDistanceKm ?? "0");
          valB = parseFloat(b.workOrder.travelDistanceKm ?? "0");
          break;
        default:
          return 0;
      }

      if (valA == null && valB == null) return 0;
      if (valA == null) return sortDir === "asc" ? -1 : 1;
      if (valB == null) return sortDir === "asc" ? 1 : -1;

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-[var(--text-muted)]" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-[var(--module-sat)]" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-[var(--module-sat)]" />
    );
  };

  const Th = ({ column, children, className = "" }: { column: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)] ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon column={column} />
      </div>
    </th>
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center">
        <p className="text-sm text-[var(--text-muted)]">No hi ha ordres que coincideixin amb els filtres.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {/* Table wrapper with horizontal scroll if needed */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]">
            <tr>
              <Th column="number">Núm.</Th>
              <Th column="title" className="min-w-[200px]">Títol</Th>
              <Th column="client">Client</Th>
              <Th column="category">Categoria</Th>
              <Th column="status">Estat</Th>
              <Th column="priority">Prioritat</Th>
              <Th column="scheduledDate">Data</Th>
              <Th column="distance">Dist.</Th>
              <Th column="number" className="text-right">Accions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map(({ workOrder, client, category, technician }) => (
              <tr
                key={workOrder.id}
                className="group transition-colors hover:bg-[var(--bg)]"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/sat/${workOrder.id}`}
                    className="font-medium text-[var(--module-sat)] hover:underline"
                  >
                    {workOrder.number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sat/${workOrder.id}`}
                    className="font-medium text-[var(--text)] hover:text-[var(--module-sat)]"
                  >
                    {workOrder.title}
                  </Link>
                  {technician && (
                    <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {technician.name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text)]">{client.name}</div>
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--module-sat)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon slug={category.icon ?? category.slug} color={category.color} size={16} />
                    <span className="text-[var(--text)]">{category.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <WorkOrderStatusBadge status={workOrder.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <WorkOrderPriorityBadge priority={workOrder.priority} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                  {workOrder.scheduledDate
                    ? new Date(workOrder.scheduledDate).toLocaleDateString("ca-ES", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                  {workOrder.travelDistanceKm ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {workOrder.travelDistanceKm} km
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={`/sat/${workOrder.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--module-sat)]/10 px-2.5 py-1 text-xs font-medium text-[var(--module-sat)] transition-colors hover:bg-[var(--module-sat)]/20"
                  >
                    Veure
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
