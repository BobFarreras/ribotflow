/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/new/page.tsx
 * Description: Create new quote page using the professional QuoteEditor.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, products } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { QuoteEditor } from "@/components/sat/QuoteEditor";

interface Props {
  searchParams: Promise<{ otId?: string; templateId?: string }>;
}

export default async function NewQuotePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { otId } = await searchParams;
  if (!otId) notFound();

  const companyId = session.user.companyId;

  // Fetch clients and products for the editor
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
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--text)]">Nou Pressupost</h1>
        </div>
      </header>

      {/* Editor */}
      <main className="min-h-0 flex-1">
        <QuoteEditor
          workOrderId={otId}
          clients={clientList}
          products={productList}
          mode="create"
        />
      </main>
    </div>
  );
}
