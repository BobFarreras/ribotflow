/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/materialService.ts
 * Description: Business logic for work order materials (CRUD + company filtering).
 */

import { db } from "@/db";
import { workOrderMaterials, workOrders } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";
import type { AddMaterialInput } from "@/lib/validators/sat/materialSchema";

export const materialService = {
  async getByWorkOrder(companyId: string, workOrderId: string) {
    // Security: verify the work order belongs to the company
    const order = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(
        and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId))
      )
      .limit(1);

    if (order.length === 0) {
      throw new Error("Work order not found or access denied");
    }

    return db
      .select()
      .from(workOrderMaterials)
      .where(eq(workOrderMaterials.workOrderId, workOrderId))
      .orderBy(workOrderMaterials.createdAt);
  },

  async add(companyId: string, input: AddMaterialInput) {
    // Security: verify the work order belongs to the company
    const order = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.id, input.workOrderId),
          eq(workOrders.companyId, companyId)
        )
      )
      .limit(1);

    if (order.length === 0) {
      throw new Error("Work order not found or access denied");
    }

    const [material] = await db
      .insert(workOrderMaterials)
      .values({
        workOrderId: input.workOrderId,
        productId: input.productId,
        name: input.name,
        quantity: String(input.quantity),
        unitPrice: input.unitPrice ? String(input.unitPrice) : null,
        unitCost: input.unitCost ? String(input.unitCost) : null,
      })
      .returning();

    return material;
  },

  async remove(companyId: string, materialId: string) {
    // Security: verify material belongs to a work order of the company
    const material = await db
      .select({
        id: workOrderMaterials.id,
        workOrderId: workOrderMaterials.workOrderId,
      })
      .from(workOrderMaterials)
      .innerJoin(
        workOrders,
        eq(workOrderMaterials.workOrderId, workOrders.id)
      )
      .where(
        and(
          eq(workOrderMaterials.id, materialId),
          eq(workOrders.companyId, companyId)
        )
      )
      .limit(1);

    if (material.length === 0) {
      throw new Error("Material not found or access denied");
    }

    await db
      .delete(workOrderMaterials)
      .where(eq(workOrderMaterials.id, materialId));
  },
};
