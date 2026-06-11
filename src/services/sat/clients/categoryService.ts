/**
 * Creation/modification date: 11/06/2026
 * Path: src/services/sat/clients/categoryService.ts
 * Description: Client categories CRUD service. Scoped by companyId for multi-tenant security.
 */

import { db } from "@/db";
import { clientCategories, clients } from "@/db/schema/sat";
import { eq, and, desc, count } from "drizzle-orm";

export interface CreateCategoryInput {
  name: string;
  color?: string | null;
  sortOrder?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export const categoryService = {
  async getAll(companyId: string) {
    return db
      .select()
      .from(clientCategories)
      .where(eq(clientCategories.companyId, companyId))
      .orderBy(desc(clientCategories.sortOrder), desc(clientCategories.createdAt));
  },

  async getById(companyId: string, categoryId: string) {
    const [category] = await db
      .select()
      .from(clientCategories)
      .where(
        and(
          eq(clientCategories.id, categoryId),
          eq(clientCategories.companyId, companyId)
        )
      )
      .limit(1);

    return category ?? null;
  },

  async create(companyId: string, input: CreateCategoryInput) {
    const [category] = await db
      .insert(clientCategories)
      .values({
        companyId,
        name: input.name,
        color: input.color ?? null,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return category;
  },

  async update(companyId: string, categoryId: string, input: UpdateCategoryInput) {
    const existing = await this.getById(companyId, categoryId);
    if (!existing) {
      throw new Error("Category not found or access denied");
    }

    const [updated] = await db
      .update(clientCategories)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })
      .where(eq(clientCategories.id, categoryId))
      .returning();

    return updated;
  },

  async delete(companyId: string, categoryId: string) {
    const existing = await this.getById(companyId, categoryId);
    if (!existing) {
      throw new Error("Category not found or access denied");
    }

    await db
      .update(clients)
      .set({ categoryId: null })
      .where(eq(clients.categoryId, categoryId));

    await db.delete(clientCategories).where(eq(clientCategories.id, categoryId));
  },

  async getClientCount(companyId: string, categoryId: string) {
    const [result] = await db
      .select({ value: count() })
      .from(clients)
      .where(
        and(
          eq(clients.companyId, companyId),
          eq(clients.categoryId, categoryId)
        )
      );

    return result?.value ?? 0;
  },
};
