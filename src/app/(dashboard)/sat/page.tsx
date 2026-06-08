/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/page.tsx
 * Description: Work order list page with 3 views (grid/table/kanban),
 *              advanced filters, and category icons.
 */

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { db } from "@/db";
import { workOrderCategories } from "@/db/schema/sat";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Wrench, Plus } from "lucide-react";
import { WorkOrderList } from "@/components/sat/work-orders/WorkOrderList";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SatListPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return null;
  }

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.workOrder");

  // Get all orders (client-side filtering for instant UX)
  const orders = await workOrderService.getByCompanyWithRelations(companyId);

  // Get categories for filter dropdown
  const categories = await db
    .select({
      id: workOrderCategories.id,
      name: workOrderCategories.name,
      slug: workOrderCategories.slug,
      icon: workOrderCategories.icon,
      color: workOrderCategories.color,
    })
    .from(workOrderCategories)
    .where(eq(workOrderCategories.companyId, companyId))
    .orderBy(workOrderCategories.sortOrder);

  // Get technicians for filter dropdown
  const technicians = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.companyId, companyId));

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">{t("list.title")}</h1>
              <p className="text-xs text-[var(--text-muted)]">{orders.length} ordres totals</p>
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

      {/* Content â€” fills remaining viewport, children handle internal scroll */}
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6">
        <WorkOrderList orders={orders} categories={categories} technicians={technicians} />
      </main>
    </div>
  );
}
