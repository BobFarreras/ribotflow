/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/[id]/page.tsx
 * Description: Quote detail/edit page using the same QuoteEditor as create.
 *              Loads existing quote data, shows save/delete/send buttons.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, products, workOrders } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { quoteService } from "@/services/sat/quotes/quoteService";
import { QuoteEditor } from "@/components/sat/quotes/QuoteEditor";
import { getCompanySettingsAction } from "@/actions/sat/company/getCompanySettings";
import { toCompanySummary } from "@/lib/utils/companySummary";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  // Fetch quote with items
  const quote = await quoteService.getById(companyId, id);
  if (!quote) {
    return (
      <div className="flex h-[calc(100dvh-1px)] items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-muted)]">Pressupost no trobat</p>
      </div>
    );
  }

  const [clientList, productList, workOrderList, companyResult] = await Promise.all([
    db.select().from(clients).where(eq(clients.companyId, companyId)),
    db.select().from(products).where(eq(products.companyId, companyId)),
    db
      .select({ id: workOrders.id, number: workOrders.number, title: workOrders.title })
      .from(workOrders)
      .where(eq(workOrders.companyId, companyId)),
    getCompanySettingsAction(),
  ]);

  const company = companyResult.success && companyResult.data
    ? toCompanySummary(companyResult.data)
    : { name: "Empresa", taxId: null, address: null, phone: null, email: null, website: null, logoUrl: null };

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      <main className="min-h-0 flex-1">
        <QuoteEditor
          workOrderId={quote.workOrderId ?? ""}
          clients={clientList}
          products={productList}
          workOrders={workOrderList}
          existingQuote={{
            id: quote.id,
            number: quote.number,
            clientId: quote.clientId,
            title: quote.title,
            description: quote.description,
            status: quote.status,
            validUntil: quote.validUntil?.toISOString() ?? null,
            taxRate: quote.taxRate,
            notes: quote.notes,
            clientNotes: quote.clientNotes,
            discountPercent: quote.discountPercent ?? "0",
            items: quote.items.map((item) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              discountPercent: item.discountPercent,
              discountAmount: item.discountAmount,
              subtotal: item.subtotal,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              total: item.total,
              category: item.category,
              sortOrder: item.sortOrder,
              productId: item.productId,
            })),
          }}
          mode="edit"
          company={company}
        />
      </main>
    </div>
  );
}
