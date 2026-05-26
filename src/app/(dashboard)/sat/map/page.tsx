/**
 * Creation/modification date: 26/05/2026
 * Path: src/app/(dashboard)/sat/map/page.tsx
 * Description: Map view of all work orders. Server Component fetches data,
 *              passes to client MapView.
 */

import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { MapView } from "@/components/sat/MapView";
import { db } from "@/db";
import { workOrders, clients, workOrderCategories } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";

export default async function WorkOrderMapPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    return null;
  }

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.map");

  const orders = await db
    .select({
      workOrder: workOrders,
      client: clients,
      category: workOrderCategories,
    })
    .from(workOrders)
    .innerJoin(clients, eq(workOrders.clientId, clients.id))
    .innerJoin(workOrderCategories, eq(workOrders.categoryId, workOrderCategories.id))
    .where(eq(workOrders.companyId, companyId));

  const ordersWithLocation = orders.filter((o) => o.client.location != null);

  if (ordersWithLocation.length === 0) {
    return (
      <div className="flex-1 bg-[var(--bg)] p-6">
        <h1 className="mb-4 text-xl font-semibold text-[var(--text)]">{t("title")}</h1>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">{t("noLocations")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-[var(--text)]">{t("title")}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {t("subtitle", { count: ordersWithLocation.length })}
        </p>
      </header>
      <MapView orders={ordersWithLocation} />
    </div>
  );
}
