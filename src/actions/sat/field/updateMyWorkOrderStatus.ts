/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/field/updateMyWorkOrderStatus.ts
 * Description: Server Action used by the mobile field view (/sat/field)
 *              to let a technician change the status of one of THEIR
 *              assigned work orders. The `assignedTo === userId`
 *              precondition is what makes this safer than the global
 *              `updateWorkOrderStatusAction` (used by OFFICE/ADMIN).
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { updateStatusSchema } from "@/lib/validators/sat/workOrderSchema";

export async function updateMyWorkOrderStatusAction(rawInput: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const input = updateStatusSchema.parse(rawInput);

    // Row-level ownership check: this OT must be assigned to the
    // current user. Refuse otherwise.
    const order = await workOrderService.getById(companyId, input.workOrderId);
    if (!order) {
      return { success: false as const, error: "NOT_FOUND" };
    }
    if (order.assignedTo !== userId) {
      return { success: false as const, error: "NOT_ASSIGNED" };
    }

    const updated = await workOrderService.updateStatus(
      companyId,
      input.workOrderId,
      userId,
      input.status,
      input.reason
    );

    revalidatePath("/sat/field");
    revalidatePath(`/sat/${input.workOrderId}`);

    return { success: true as const, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false as const, error: error.message };
    }
    return { success: false as const, error: "Failed to update status" };
  }
}
