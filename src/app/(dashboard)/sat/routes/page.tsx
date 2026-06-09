/**
 * Creation/modification date: 26/05/2026
 * Path: src/app/(dashboard)/sat/routes/page.tsx
 * Description: Route planning page. Server Component fetches data,
 *              passes to client RoutePlanner.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workOrders, clients } from "@/db/schema/sat";
import { companies } from "@/db/schema/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { RoutePlanner } from "@/components/sat/work-orders/RoutePlanner";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function RoutePlanningPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return null;
  }

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.routes");

  // Get selected date or default to today
  const params = await searchParams;
  const selectedDate = params.date ?? new Date().toISOString().split("T")[0];

  // Get company HQ
  const [company] = await db
    .select({
      name: companies.name,
      location: companies.companyLocation,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  // Get work orders for the selected date that are assigned or in_progress
  const dayStart = new Date(`${selectedDate}T00:00:00`);
  const dayEnd = new Date(`${selectedDate}T23:59:59`);

  const orders = await db
    .select({
      workOrder: workOrders,
      client: clients,
    })
    .from(workOrders)
    .innerJoin(clients, eq(workOrders.clientId, clients.id))
    .where(
      and(
        eq(workOrders.companyId, companyId),
        eq(workOrders.status, "assigned"),
        gte(workOrders.scheduledDate, dayStart),
        lte(workOrders.scheduledDate, dayEnd)
      )
    );

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-[var(--text)]">{t("title")}</h1>
        <p className="text-sm text-[var(--text-muted)]">{t("subtitle")}</p>
      </header>
      <RoutePlanner
        orders={orders}
        hq={company?.location ?? { lat: 41.3851, lng: 2.1734 }}
      />
    </div>
  );
}
