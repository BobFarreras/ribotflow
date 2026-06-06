/**
 * Creation/modification date: 28/05/2026
 * Path: src/services/sat/quoteTemplateService.ts
 * Description: Business logic for quote templates (CRUD + apply to quote).
 */

import { db } from "@/db";
import { quoteTemplates } from "@/db/schema/sat";
import { eq, and, desc, sql } from "drizzle-orm";
import type { CreateTemplateInput, UpdateTemplateInput } from "@/lib/validators/sat/quoteSchema";

export const quoteTemplateService = {
  async create(companyId: string, userId: string, input: CreateTemplateInput) {
    const [template] = await db
      .insert(quoteTemplates)
      .values({
        companyId,
        name: input.name,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        defaultItems: input.defaultItems ?? null,
        defaultNotes: input.defaultNotes ?? null,
        defaultTaxRate: String(input.defaultTaxRate ?? 21),
        isActive: true,
        usageCount: 0,
        createdBy: userId,
      })
      .returning();

    return template;
  },

  async getById(companyId: string, templateId: string) {
    const [template] = await db
      .select()
      .from(quoteTemplates)
      .where(and(eq(quoteTemplates.id, templateId), eq(quoteTemplates.companyId, companyId)))
      .limit(1);

    return template ?? null;
  },

  async getByCompany(companyId: string, includeInactive = false) {
    const conditions = [eq(quoteTemplates.companyId, companyId)];

    if (!includeInactive) {
      conditions.push(eq(quoteTemplates.isActive, true));
    }

    return db
      .select()
      .from(quoteTemplates)
      .where(and(...conditions))
      .orderBy(desc(quoteTemplates.usageCount));
  },

  async update(companyId: string, templateId: string, input: UpdateTemplateInput) {
    const [existing] = await db
      .select()
      .from(quoteTemplates)
      .where(and(eq(quoteTemplates.id, templateId), eq(quoteTemplates.companyId, companyId)))
      .limit(1);

    if (!existing) {
      throw new Error("Template not found");
    }

    const [updated] = await db
      .update(quoteTemplates)
      .set({
        ...input,
        defaultTaxRate: input.defaultTaxRate ? String(input.defaultTaxRate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(quoteTemplates.id, templateId))
      .returning();

    return updated;
  },

  async delete(companyId: string, templateId: string) {
    const [existing] = await db
      .select()
      .from(quoteTemplates)
      .where(and(eq(quoteTemplates.id, templateId), eq(quoteTemplates.companyId, companyId)))
      .limit(1);

    if (!existing) {
      throw new Error("Template not found");
    }

    await db.delete(quoteTemplates).where(eq(quoteTemplates.id, templateId));
  },

  async duplicate(companyId: string, userId: string, templateId: string) {
    const [existing] = await db
      .select()
      .from(quoteTemplates)
      .where(and(eq(quoteTemplates.id, templateId), eq(quoteTemplates.companyId, companyId)))
      .limit(1);

    if (!existing) {
      throw new Error("Template not found");
    }

    const [duplicate] = await db
      .insert(quoteTemplates)
      .values({
        companyId,
        name: `${existing.name} (còpia)`,
        description: existing.description,
        categoryId: existing.categoryId,
        defaultItems: existing.defaultItems,
        defaultNotes: existing.defaultNotes,
        defaultTaxRate: existing.defaultTaxRate,
        isActive: true,
        usageCount: 0,
        createdBy: userId,
      })
      .returning();

    return duplicate;
  },

  async incrementUsage(templateId: string) {
    await db
      .update(quoteTemplates)
      .set({
        usageCount: sql`usage_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(quoteTemplates.id, templateId));
  },
};
