/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/productService.ts
 * Description: Minimal product catalog service for SAT (future ERP module).
 */

import { db } from "@/db";
import { products } from "@/db/schema/sat";
import { eq, and, like, sql } from "drizzle-orm";

export const productService = {
  async getByCompany(companyId: string, search?: string) {
    const conditions = [eq(products.companyId, companyId), eq(products.isActive, true)];

    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`
      );
    }

    return db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(products.name);
  },

  async getById(companyId: string, productId: string) {
    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.companyId, companyId)))
      .limit(1);

    return result[0] ?? null;
  },

  async create(
    companyId: string,
    input: {
      name: string;
      sku?: string;
      unitPrice?: number;
      unitCost?: number;
      stock?: number;
    }
  ) {
    const [product] = await db
      .insert(products)
      .values({
        companyId,
        name: input.name,
        sku: input.sku ?? null,
        unitPrice: input.unitPrice ? String(input.unitPrice) : null,
        unitCost: input.unitCost ? String(input.unitCost) : null,
        stock: input.stock ?? null,
      })
      .returning();

    return product;
  },
};
