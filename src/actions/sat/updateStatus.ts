/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/actions/sat/updateStatus.ts
 * Descripció: Server Action per a actualitzar l'estat d'una ordre de treball.
 */

"use server";

import { auth } from "@/lib/auth";
import { updateStatusSchema } from "@/lib/validators/sat/workOrderSchema";
import { workOrderService } from "@/services/sat/workOrderService";
import { revalidatePath } from "next/cache";

export async function updateWorkOrderStatusAction(rawInput: unknown) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const input = updateStatusSchema.parse(rawInput);

    const workOrder = await workOrderService.updateStatus(
      session.user.companyId,
      input.workOrderId,
      session.user.id as string,
      input.status,
      input.reason
    );

    revalidatePath("/dashboard/sat");
    revalidatePath(`/dashboard/sat/${input.workOrderId}`);

    return { success: true, data: workOrder };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update status" };
  }
}
