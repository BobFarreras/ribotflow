/**
 * Creation/modification date: 28/05/2026
 * Path: src/services/sat/quoteItemService.ts
 * Description: Business logic for quote line items (CRUD + recalculation).
 */

import { db } from "@/db";
import { quoteItems, quotes } from "@/db/schema/sat";
import { eq, and, sql } from "drizzle-orm";
import type { AddQuoteItemInput, UpdateQuoteItemInput } from "@/lib/validators/sat/quoteSchema";

/* ============================================================
   CALCULATIONS
   ============================================================ */

function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  discountPercent: number,
  discountAmount: number,
  taxRate: number
) {
  const rawSubtotal = quantity * unitPrice;
  const discount = discountAmount > 0 ? discountAmount : (rawSubtotal * discountPercent) / 100;
  const subtotal = rawSubtotal - discount;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

async function recalculateQuoteTotals(quoteId: string) {
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const taxAmount = items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
  const total = subtotal + taxAmount;

  await db
    .update(quotes)
    .set({
      subtotal: String(Math.round(subtotal * 100) / 100),
      taxAmount: String(Math.round(taxAmount * 100) / 100),
      total: String(Math.round(total * 100) / 100),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));
}

/* ============================================================
   CRUD OPERATIONS
   ============================================================ */

export const quoteItemService = {
  async add(companyId: string, quoteId: string, input: AddQuoteItemInput) {
    // Verify quote exists and is draft
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "draft") {
      throw new Error("Only draft quotes can be modified");
    }

    const taxRate = Number(quote.taxRate);
    const totals = calculateItemTotals(
      input.quantity,
      input.unitPrice,
      input.discountPercent ?? 0,
      input.discountAmount ?? 0,
      taxRate
    );

    // Get next sort order
    const maxSort = await db
      .select({ maxSort: sql<number>`COALESCE(MAX(${quoteItems.sortOrder}), 0)` })
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quoteId))
      .then((r) => r[0]?.maxSort ?? 0);

    const [item] = await db
      .insert(quoteItems)
      .values({
        quoteId,
        productId: input.productId ?? null,
        description: input.description,
        quantity: String(input.quantity),
        unit: input.unit,
        unitPrice: String(input.unitPrice),
        unitCost: input.unitCost ? String(input.unitCost) : null,
        discountPercent: String(input.discountPercent ?? 0),
        discountAmount: String(totals.discountAmount),
        subtotal: String(totals.subtotal),
        taxRate: String(taxRate),
        taxAmount: String(totals.taxAmount),
        total: String(totals.total),
        sortOrder: input.sortOrder ?? maxSort + 1,
        category: input.category,
      })
      .returning();

    // Recalculate quote totals
    await recalculateQuoteTotals(quoteId);

    return item;
  },

  async update(companyId: string, itemId: string, input: UpdateQuoteItemInput) {
    // Get the item with quote info
    const [existing] = await db
      .select({
        item: quoteItems,
        quote: quotes,
      })
      .from(quoteItems)
      .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
      .where(and(eq(quoteItems.id, itemId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (!existing) {
      throw new Error("Quote item not found");
    }

    if (existing.quote.status !== "draft") {
      throw new Error("Only draft quotes can be modified");
    }

    const taxRate = Number(existing.quote.taxRate);
    const quantity = input.quantity ?? Number(existing.item.quantity);
    const unitPrice = input.unitPrice ?? Number(existing.item.unitPrice);
    const discountPercent = input.discountPercent ?? Number(existing.item.discountPercent);
    const discountAmount = input.discountAmount ?? Number(existing.item.discountAmount);

    const totals = calculateItemTotals(
      quantity,
      unitPrice,
      discountPercent,
      discountAmount,
      taxRate
    );

    const [updated] = await db
      .update(quoteItems)
      .set({
        ...input,
        quantity: input.quantity ? String(input.quantity) : undefined,
        unitPrice: input.unitPrice ? String(input.unitPrice) : undefined,
        unitCost: input.unitCost !== undefined ? String(input.unitCost) : undefined,
        discountPercent:
          input.discountPercent !== undefined ? String(input.discountPercent) : undefined,
        discountAmount: String(totals.discountAmount),
        subtotal: String(totals.subtotal),
        taxRate: String(taxRate),
        taxAmount: String(totals.taxAmount),
        total: String(totals.total),
        updatedAt: new Date(),
      })
      .where(eq(quoteItems.id, itemId))
      .returning();

    // Recalculate quote totals
    await recalculateQuoteTotals(existing.item.quoteId);

    return updated;
  },

  async remove(companyId: string, itemId: string) {
    const [existing] = await db
      .select({
        item: quoteItems,
        quote: quotes,
      })
      .from(quoteItems)
      .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
      .where(and(eq(quoteItems.id, itemId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (!existing) {
      throw new Error("Quote item not found");
    }

    if (existing.quote.status !== "draft") {
      throw new Error("Only draft quotes can be modified");
    }

    await db.delete(quoteItems).where(eq(quoteItems.id, itemId));

    // Recalculate quote totals
    await recalculateQuoteTotals(existing.item.quoteId);
  },

  async reorder(companyId: string, quoteId: string, itemIds: string[]) {
    // Verify quote exists and is draft
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "draft") {
      throw new Error("Only draft quotes can be modified");
    }

    // Update sort orders
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(quoteItems)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(quoteItems.id, itemIds[i]), eq(quoteItems.quoteId, quoteId)));
    }
  },

  async getByQuote(companyId: string, quoteId: string) {
    return db
      .select()
      .from(quoteItems)
      .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
      .where(and(eq(quoteItems.quoteId, quoteId), eq(quotes.companyId, companyId)))
      .orderBy(quoteItems.sortOrder);
  },
};
