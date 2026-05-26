/**
 * Creation/modification date: 26/05/2026
 * Path: src/app/(dashboard)/sat/page.tsx
 * Description: Work order list page — orchestrates data fetching and delegates
 *              presentation to focused components (SoC / SOLID).
 */

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/workOrderService";
import type { WorkOrderStatus } from "@/types/sat";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Wrench, Plus } from "lucide-react";
import { StatusFilterBar } from "@/components/sat/StatusFilterBar";
import { WorkOrderCard } from "@/components/sat/WorkOrderCard";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function SatListPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return null;
  }

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.workOrder");
  const params = await searchParams;

  const statusFilter = params.status as WorkOrderStatus | undefined;
  const orders = await workOrderService.getByCompanyWithRelations(companyId, {
    status: statusFilter,
  });

  return (
    <div className="flex-1 bg-[var(--bg)]">
      {/* Header */}
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

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <StatusFilterBar activeStatus={params.status} />

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
              <WorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                client={client}
                category={category}
                technicianName={technician?.name}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
