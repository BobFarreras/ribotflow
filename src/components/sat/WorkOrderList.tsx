/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderList.tsx
 * Description: Client component that manages filters, pagination, and switches
 *              between grid, table and kanban views. Occupies full viewport.
 */

"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { WorkOrder } from "@/types/sat";
import { WorkOrderFilters } from "./WorkOrderFilters";
import { WorkOrderCard } from "./WorkOrderCard";
import { WorkOrderTable } from "./WorkOrderTable";
import { WorkOrderKanban } from "./WorkOrderKanban";
import { Pagination } from "@/components/ui/Pagination";

interface OrderItem {
  workOrder: WorkOrder;
  client: { id: string; name: string; phone: string | null; address: string | null };
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null };
  technician: { id: string; name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
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
  const router = useRouter();
  const pathname = usePathname();

  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const statusFilters = searchParams.get("status")?.split(",") ?? [];
  const categoryFilters = searchParams.get("category")?.split(",") ?? [];
  const priorityFilters = searchParams.get("priority")?.split(",") ?? [];
  const technicianFilter = searchParams.get("technician");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const view = searchParams.get("view") || "grid";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = [25, 50, 100].includes(parseInt(searchParams.get("limit") ?? "25", 10))
    ? parseInt(searchParams.get("limit") ?? "25", 10)
    : 25;

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    return orders.filter((item) => {
      const { workOrder, client, category, technician } = item;

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

      if (statusFilters.length > 0 && !statusFilters.includes(workOrder.status)) return false;
      if (categoryFilters.length > 0 && !categoryFilters.includes(category.id)) return false;
      if (priorityFilters.length > 0 && !priorityFilters.includes(workOrder.priority)) return false;
      if (technicianFilter && technician?.id !== technicianFilter) return false;

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

  // Pagination slice
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const isKanban = view === "kanban";

  return (
    <div className="flex h-full flex-col gap-3">
      <WorkOrderFilters categories={categories} technicians={technicians} />

      {/* Content area — scrollable independently per view */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] text-center">
            <p className="text-sm text-[var(--text-muted)]">{t("list.noResults")}</p>
          </div>
        ) : view === "table" ? (
          <WorkOrderTable orders={paginated} />
        ) : view === "kanban" ? (
          <WorkOrderKanban orders={filtered} />
        ) : (
          <div className="grid h-full auto-rows-min gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 content-start">
            {paginated.map((item) => (
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

      {/* Pagination — only at bottom */}
      {!isKanban && (
        <div className="flex shrink-0 items-center justify-between border-t border-[var(--border)] pt-2">
          <div className="text-xs text-[var(--text-muted)]">
            {filtered.length} de {orders.length} ordres
          </div>
          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={(p) => setParam("page", String(p))}
            onPageSizeChange={(s) => {
              setParam("limit", String(s));
              setParam("page", "1");
            }}
          />
        </div>
      )}
    </div>
  );
}
