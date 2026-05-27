/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderList.tsx
 * Description: Client component that manages filters and switches between
 *              grid, table and kanban views.
 */

"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { WorkOrder } from "@/types/sat";
import { WorkOrderFilters } from "./WorkOrderFilters";
import { WorkOrderCard } from "./WorkOrderCard";
import { WorkOrderTable } from "./WorkOrderTable";
import { WorkOrderKanban } from "./WorkOrderKanban";

interface OrderItem {
  workOrder: WorkOrder;
  client: { id: string; name: string; phone: string | null; address: string | null };
  category: { id: string; name: string; slug: string; color: string | null };
  technician: { id: string; name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface TechnicianOption {
  id: string;
  name: string;
}

interface Props {
  orders: OrderItem[];
  categories: CategoryOption[];
  technicians: TechnicianOption[];
}

export function WorkOrderList({ orders, categories, technicians }: Props) {
  const t = useTranslations("sat.workOrder");
  const searchParams = useSearchParams();

  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const statusFilters = searchParams.get("status")?.split(",") ?? [];
  const categoryFilters = searchParams.get("category")?.split(",") ?? [];
  const priorityFilters = searchParams.get("priority")?.split(",") ?? [];
  const technicianFilter = searchParams.get("technician");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const view = searchParams.get("view") || "grid";

  const filtered = useMemo(() => {
    return orders.filter((item) => {
      const { workOrder, client, category, technician } = item;

      // Text search
      if (search) {
        const haystack = [
          workOrder.number,
          workOrder.title,
          client.name,
          category.name,
          workOrder.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(workOrder.status)) return false;

      // Category filter
      if (categoryFilters.length > 0 && !categoryFilters.includes(category.id)) return false;

      // Priority filter
      if (priorityFilters.length > 0 && !priorityFilters.includes(workOrder.priority)) return false;

      // Technician filter
      if (technicianFilter && technician?.id !== technicianFilter) return false;

      // Date range
      if (dateFrom || dateTo) {
        const scheduled = workOrder.scheduledDate ? new Date(workOrder.scheduledDate) : null;
        if (!scheduled) return false;
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (scheduled < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (scheduled > to) return false;
        }
      }

      return true;
    });
  }, [orders, search, statusFilters, categoryFilters, priorityFilters, technicianFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <WorkOrderFilters categories={categories} technicians={technicians} />

      <div className="text-xs text-[var(--text-muted)]">
        {filtered.length} de {orders.length} ordres
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">{t("list.noResults")}</p>
        </div>
      ) : view === "table" ? (
        <WorkOrderTable orders={filtered} />
      ) : view === "kanban" ? (
        <WorkOrderKanban orders={filtered} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <WorkOrderCard
              key={item.workOrder.id}
              workOrder={item.workOrder}
              client={item.client}
              category={item.category}
              technicianName={item.technician?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
