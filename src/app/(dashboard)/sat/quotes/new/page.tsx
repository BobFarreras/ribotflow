/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/new/page.tsx
 * Description: Create new quote page using the professional QuoteEditor.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, products, workOrders } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { QuoteEditor } from "@/components/sat/quotes/QuoteEditor";
import { getCompanySettingsAction } from "@/actions/sat/company/getCompanySettings";
import { toCompanySummary } from "@/lib/utils/companySummary";

interface Props {
  searchParams: Promise<{ otId?: string; templateId?: string }>;
}

export default async function NewQuotePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { otId } = await searchParams;
  const companyId = session.user.companyId;

  const [clientList, productList, workOrderList, _workOrder, companyResult] = await Promise.all([
    db.select().from(clients).where(eq(clients.companyId, companyId)),
    db.select().from(products).where(eq(products.companyId, companyId)),
    db
      .select({
        id: workOrders.id,
        number: workOrders.number,
        title: workOrders.title,
      })
      .from(workOrders)
      .where(eq(workOrders.companyId, companyId)),
    otId
      ? db
          .select()
          .from(workOrders)
          .where(eq(workOrders.id, otId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    getCompanySettingsAction(),
  ]);

  const company =
    companyResult.success && companyResult.data
      ? toCompanySummary(companyResult.data)
      : {
          name: "Empresa",
          taxId: null,
          address: null,
          phone: null,
          email: null,
          website: null,
          logoUrl: null,
        };

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      <main className="min-h-0 flex-1">
        <QuoteEditor
          workOrderId={otId ?? ""}
          clients={clientList}
          products={productList}
          workOrders={workOrderList}
          mode="create"
          company={company}
        />
      </main>
    </div>
  );
}
