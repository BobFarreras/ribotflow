/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/new/page.tsx
 * Description: Create new quote page using the professional QuoteEditor.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, products, workOrders } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { QuoteEditor } from "@/components/sat/QuoteEditor";

interface Props {
  searchParams: Promise<{ otId?: string; templateId?: string }>;
}

export default async function NewQuotePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { otId } = await searchParams;
  const companyId = session.user.companyId;

  // Fetch clients, products, and optionally the work order
  const [clientList, productList, workOrder] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(eq(clients.companyId, companyId)),
    db
      .select()
      .from(products)
      .where(eq(products.companyId, companyId)),
    otId
      ? db
          .select()
          .from(workOrders)
          .where(eq(workOrders.id, otId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--text)]">Nou Pressupost</h1>
          {workOrder && (
            <span className="rounded bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
              OT: {workOrder.number}
            </span>
          )}
        </div>
      </header>

      {/* Editor */}
      <main className="min-h-0 flex-1">
        <QuoteEditor
          workOrderId={otId ?? ""}
          clients={clientList}
          products={productList}
          mode="create"
        />
      </main>
    </div>
  );
}
