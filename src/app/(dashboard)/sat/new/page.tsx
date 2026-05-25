/**
 * Creation/modification date: 24/05/2026
 * Path: src/app/(dashboard)/sat/new/page.tsx
 * Description: New work order page – server component that fetches clients and categories.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, workOrderCategories } from "@/db/schema/sat";
import { eq, asc } from "drizzle-orm";
import { WorkOrderForm } from "@/components/sat/WorkOrderForm";

export default async function NewWorkOrderPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    return null;
  }

  const companyId = session.user.companyId;

  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.companyId, companyId))
    .orderBy(asc(clients.name));

  const categoryList = await db
    .select({
      id: workOrderCategories.id,
      name: workOrderCategories.name,
      color: workOrderCategories.color,
    })
    .from(workOrderCategories)
    .where(eq(workOrderCategories.companyId, companyId))
    .orderBy(asc(workOrderCategories.sortOrder));

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <WorkOrderForm clients={clientList} categories={categoryList} />
    </div>
  );
}
