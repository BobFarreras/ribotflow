/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/actions/sat/createWorkOrder.ts
 * Descripció: Server Action per a crear una nova ordre de treball.
 */

"use server";

import { auth } from "@/lib/auth";
import { createWorkOrderSchema } from "@/lib/validators/sat/workOrderSchema";
import { workOrderService } from "@/services/sat/workOrderService";
import { revalidatePath } from "next/cache";

export async function createWorkOrderAction(rawInput: unknown) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const input = createWorkOrderSchema.parse(rawInput);

    const workOrder = await workOrderService.create(
      session.user.companyId,
      session.user.id as string,
      input
    );

    revalidatePath("/sat");

    return { success: true, data: workOrder };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create work order" };
  }
}
