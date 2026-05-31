/**
 * Creation/modification date: 28/05/2026
 * Path: src/services/sat/quoteService.ts
 * Description: Business logic for quotes (CRUD + workflow + calculations).
 */

import { db } from "@/db";
import {
  quotes,
  quoteItems,
  quoteStatusHistory,
  workOrders,
} from "@/db/schema/sat";
import { eq, and, desc, sql, count } from "drizzle-orm";
import type {
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteStatusInput,
} from "@/lib/validators/sat/quoteSchema";
import { isValidQuoteTransition, type QuoteStatus } from "@/lib/constants/statusTransitions";

/* ============================================================
   NUMBER GENERATION
   ============================================================ */

async function getNextQuoteNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRE-${year}-`;

  const result = await db
    .select({ maxNumber: sql<string>`MAX(${quotes.number})` })
    .from(quotes)
    .where(
      and(eq(quotes.companyId, companyId), sql`${quotes.number} LIKE ${prefix + "%"}`
    )
  );

  const maxNumber = result[0]?.maxNumber;
  let sequence = 1;

  if (maxNumber) {
    const match = maxNumber.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}

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

function calculateQuoteTotals(
  items: Array<{ subtotal: string | number; taxAmount: string | number; total: string | number }>
) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const taxAmount = items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/* ============================================================
   CRUD OPERATIONS
   ============================================================ */

export const quoteService = {
  async create(companyId: string, userId: string, input: CreateQuoteInput) {
    const number = await getNextQuoteNumber(companyId);
    const taxRate = input.taxRate ?? 21;

    // Calculate item totals
    const itemsWithTotals = input.items.map((item, index) => {
      const totals = calculateItemTotals(
        item.quantity,
        item.unitPrice,
        item.discountPercent ?? 0,
        item.discountAmount ?? 0,
        taxRate
      );

      return {
        ...item,
        subtotal: String(totals.subtotal),
        discountAmount: String(totals.discountAmount),
        taxAmount: String(totals.taxAmount),
        total: String(totals.total),
        taxRate: String(taxRate),
        sortOrder: item.sortOrder ?? index,
      };
    });

    // Calculate quote totals
    const quoteTotals = calculateQuoteTotals(itemsWithTotals);

    // Create quote with items in a transaction
    const result = await db.transaction(async (tx) => {
      // Create the quote
      const [quote] = await tx
        .insert(quotes)
        .values({
          companyId,
          workOrderId: input.workOrderId,
          clientId: input.clientId,
          number,
          title: input.title,
          description: input.description ?? null,
          status: "draft",
          version: 1,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          subtotal: String(quoteTotals.subtotal),
          taxRate: String(taxRate),
          taxAmount: String(quoteTotals.taxAmount),
          total: String(quoteTotals.total),
          notes: input.notes ?? null,
          clientNotes: input.clientNotes ?? null,
          templateId: input.templateId ?? null,
          createdBy: userId,
        })
        .returning();

      // Create the items
      if (itemsWithTotals.length > 0) {
        await tx.insert(quoteItems).values(
          itemsWithTotals.map((item) => ({
            quoteId: quote.id,
            productId: item.productId ?? null,
            description: item.description,
            quantity: String(item.quantity),
            unit: item.unit,
            unitPrice: String(item.unitPrice),
            unitCost: item.unitCost ? String(item.unitCost) : null,
            discountPercent: String(item.discountPercent ?? 0),
            discountAmount: String(item.discountAmount),
            subtotal: item.subtotal,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            total: item.total,
            sortOrder: item.sortOrder,
            category: item.category,
          }))
        );
      }

      // Add initial status history
      await tx.insert(quoteStatusHistory).values({
        quoteId: quote.id,
        statusFrom: null,
        statusTo: "draft",
        changedBy: userId,
        reason: "Quote created",
      });

      // Update template usage count if used
      if (input.templateId) {
        await tx
          .update(await import("@/db/schema/sat").then((m) => m.quoteTemplates))
          .set({ usageCount: sql`usage_count + 1` })
          .where(eq(await import("@/db/schema/sat").then((m) => m.quoteTemplates.id), input.templateId));
      }

      return quote;
    });

    return result;
  },

  async getById(companyId: string, quoteId: string) {
    const result = await db
      .select({
        quote: quotes,
        items: quoteItems,
      })
      .from(quotes)
      .innerJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .orderBy(quoteItems.sortOrder);

    if (result.length === 0) return null;

    return {
      ...result[0].quote,
      items: result.map((r) => r.items),
    };
  },

  async getByCompany(
    companyId: string,
    filters?: {
      status?: string;
      clientId?: string;
      workOrderId?: string;
    }
  ) {
    const conditions = [eq(quotes.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(quotes.status, filters.status as QuoteStatus));
    }

    if (filters?.clientId) {
      conditions.push(eq(quotes.clientId, filters.clientId));
    }

    if (filters?.workOrderId) {
      conditions.push(eq(quotes.workOrderId, filters.workOrderId));
    }

    return db
      .select()
      .from(quotes)
      .where(and(...conditions))
      .orderBy(desc(quotes.createdAt));
  },

  async getByWorkOrder(companyId: string, workOrderId: string) {
    return db
      .select()
      .from(quotes)
      .where(and(eq(quotes.companyId, companyId), eq(quotes.workOrderId, workOrderId)))
      .orderBy(desc(quotes.createdAt));
  },

  async update(companyId: string, quoteId: string, input: UpdateQuoteInput) {
    const existing = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Quote not found");
    }

    if (existing[0].status !== "draft") {
      throw new Error("Only draft quotes can be edited");
    }

    // Update quote in a transaction
    const result = await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Only include fields that are defined
      if (input.workOrderId !== undefined) updateData.workOrderId = input.workOrderId;
      if (input.clientId !== undefined) updateData.clientId = input.clientId;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.taxRate !== undefined) updateData.taxRate = String(input.taxRate);
      if (input.discountPercent !== undefined) updateData.discountPercent = String(input.discountPercent);
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.clientNotes !== undefined) updateData.clientNotes = input.clientNotes;

      if (input.validUntil) {
        updateData.validUntil = new Date(input.validUntil);
      }

      const [updated] = await tx
        .update(quotes)
        .set(updateData)
        .where(eq(quotes.id, quoteId))
        .returning();

      // Update items if provided
      if (input.items && input.items.length > 0) {
        // Delete existing items
        await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

        // Calculate tax rate from quote or use default
        const taxRate = input.taxRate ?? Number(existing[0].taxRate);

        // Insert new items
        const itemsWithTotals = input.items.map((item, index) => {
          const subtotal = item.quantity * item.unitPrice;
          const discount = item.discountAmount > 0
            ? item.discountAmount
            : (subtotal * (item.discountPercent ?? 0)) / 100;
          const itemSubtotal = subtotal - discount;
          const taxAmount = (itemSubtotal * taxRate) / 100;
          const total = itemSubtotal + taxAmount;

          return {
            quoteId,
            productId: item.productId ?? null,
            description: item.description,
            quantity: String(item.quantity),
            unit: item.unit,
            unitPrice: String(item.unitPrice),
            unitCost: item.unitCost ? String(item.unitCost) : null,
            discountPercent: String(item.discountPercent ?? 0),
            discountAmount: String(discount),
            subtotal: String(Math.round(itemSubtotal * 100) / 100),
            taxRate: String(taxRate),
            taxAmount: String(Math.round(taxAmount * 100) / 100),
            total: String(Math.round(total * 100) / 100),
            sortOrder: index,
            category: item.category,
          };
        });

        await tx.insert(quoteItems).values(itemsWithTotals);

        // Recalculate quote totals
        const subtotal = itemsWithTotals.reduce((sum, item) => sum + Number(item.subtotal), 0);
        const taxAmount = itemsWithTotals.reduce((sum, item) => sum + Number(item.taxAmount), 0);
        const discountPercent = input.discountPercent ?? Number(existing[0].discountPercent ?? 0);
        const discountAmount = (subtotal * discountPercent) / 100;
        const total = subtotal - discountAmount + taxAmount;

        await tx
          .update(quotes)
          .set({
            subtotal: String(Math.round(subtotal * 100) / 100),
            discountPercent: String(discountPercent),
            taxAmount: String(Math.round(taxAmount * 100) / 100),
            total: String(Math.round(total * 100) / 100),
          })
          .where(eq(quotes.id, quoteId));
      }

      return updated;
    });

    return result;
  },

  async updateStatus(
    companyId: string,
    quoteId: string,
    userId: string,
    input: QuoteStatusInput
  ) {
    const existing = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Quote not found");
    }

    const currentStatus = existing[0].status;

    if (!isValidQuoteTransition(currentStatus as QuoteStatus, input.status)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${input.status}`);
    }

    const updateData: Partial<typeof quotes.$inferInsert> = {
      status: input.status,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (input.status === "sent") {
      updateData.sentAt = new Date();
    } else if (input.status === "accepted") {
      updateData.acceptedAt = new Date();
    } else if (input.status === "rejected") {
      updateData.rejectedAt = new Date();
    }

    const [updated] = await db
      .update(quotes)
      .set(updateData)
      .where(eq(quotes.id, quoteId))
      .returning();

    // Add status history
    await db.insert(quoteStatusHistory).values({
      quoteId,
      statusFrom: currentStatus,
      statusTo: input.status,
      changedBy: userId,
      reason: input.reason ?? null,
    });

    return updated;
  },

  async delete(companyId: string, quoteId: string) {
    const existing = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Quote not found");
    }

    if (existing[0].status !== "draft") {
      throw new Error("Only draft quotes can be deleted");
    }

    await db.delete(quotes).where(eq(quotes.id, quoteId));
  },

  async getStatusHistory(quoteId: string) {
    return db
      .select()
      .from(quoteStatusHistory)
      .where(eq(quoteStatusHistory.quoteId, quoteId))
      .orderBy(desc(quoteStatusHistory.createdAt));
  },

  async getStats(companyId: string) {
    const total = await db
      .select({ count: count() })
      .from(quotes)
      .where(eq(quotes.companyId, companyId))
      .then((r) => r[0]?.count ?? 0);

    const byStatus = await db
      .select({
        status: quotes.status,
        count: count(),
      })
      .from(quotes)
      .where(eq(quotes.companyId, companyId))
      .groupBy(quotes.status);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r.count])),
    };
  },
};
