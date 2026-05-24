/**
 * Creation/modification date: 24/05/2026
 * Path: src/app/(dashboard)/sat/page.tsx
 * Description: Work order list page with status filter and mobile-first layout.
 */

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/workOrderService";
import type { WorkOrderStatus } from "@/types/sat";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench, Plus, Filter } from "lucide-react";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function SatListPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.workOrder");
  const params = await searchParams;

  const statusFilter = params.status as WorkOrderStatus | undefined;
  const orders = await workOrderService.getByCompanyWithRelations(companyId, {
    status: statusFilter,
  });

  const statusOptions: { key: WorkOrderStatus | "all"; label: string }[] = [
    { key: "all", label: t("list.status.all") },
    { key: "pending", label: t("list.status.pending") },
    { key: "assigned", label: t("list.status.assigned") },
    { key: "in_progress", label: t("list.status.in_progress") },
    { key: "paused", label: t("list.status.paused") },
    { key: "completed", label: t("list.status.completed") },
    { key: "closed", label: t("list.status.closed") },
    { key: "cancelled", label: t("list.status.cancelled") },
  ];

  function statusBadgeColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "assigned":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "paused":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "completed":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "closed":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function priorityBadgeColor(priority: string) {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">{t("list.title")}</h1>
              <p className="text-xs text-[var(--text-muted)]">{orders.length} ordres</p>
            </div>
          </div>
          <Link
            href="/sat/new"
            className="flex items-center gap-1.5 rounded-md bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("list.newButton")}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {/* Filters */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          {statusOptions.map((opt) => (
            <Link
              key={opt.key}
              href={opt.key === "all" ? "/sat" : `/sat?status=${opt.key}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                (params.status ?? "all") === opt.key
                  ? "border-[var(--module-sat)] bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center">
            <Wrench className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text)]">{t("list.emptyState")}</p>
            <Link
              href="/sat/new"
              className="mt-4 rounded-md bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white"
            >
              {t("list.newButton")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map(({ workOrder, client, category, technician }) => (
              <Link
                key={workOrder.id}
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
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeColor(workOrder.status)}`}
                  >
                    {t(`list.status.${workOrder.status}`)}
                  </span>
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
                  {technician?.name ? `👤 ${technician.name}` : t("detail.unassigned")}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityBadgeColor(workOrder.priority)}`}
                  >
                    {t(`list.priority.${workOrder.priority}`)}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {workOrder.scheduledDate
                      ? new Date(workOrder.scheduledDate).toLocaleDateString("ca-ES")
                      : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
