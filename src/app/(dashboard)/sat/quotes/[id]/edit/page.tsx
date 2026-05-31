/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/[id]/edit/page.tsx
 * Description: Edit quote page using the same QuoteEditor as create.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, products, quotes } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { QuoteEditor } from "@/components/sat/QuoteEditor";
import { quoteService } from "@/services/sat/quoteService";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  // Fetch quote with items
  const quote = await quoteService.getById(companyId, id);
  if (!quote) notFound();

  // Fetch clients and products
  const [clientList, productList] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(eq(clients.companyId, companyId)),
    db
      .select()
      .from(products)
      .where(eq(products.companyId, companyId)),
  ]);

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      <main className="min-h-0 flex-1">
        <QuoteEditor
          workOrderId={quote.workOrderId ?? ""}
          clients={clientList}
          products={productList}
          existingQuote={{
            id: quote.id,
            number: quote.number,
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
        />
      </main>
    </div>
  );
}
