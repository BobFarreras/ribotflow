/**
 * Creation/modification date: 24/05/2026
 * Path: src/actions/sat/assignTechnician.ts
 * Description: Server Action to assign or unassign a technician to a work order.
 */

"use server";

import { auth } from "@/lib/auth";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { revalidatePath } from "next/cache";

export async function assignTechnicianAction(workOrderId: string, technicianId: string | null) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = session.user.role;
    if (userRole === "TECHNICIAN") {
      return { success: false, error: "Technicians cannot assign orders" };
    }

    const workOrder = await workOrderService.assignTechnician(
      session.user.companyId,
      workOrderId,
      technicianId
    );

    revalidatePath("/sat");
    revalidatePath(`/sat/${workOrderId}`);

    return { success: true, data: workOrder };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to assign technician" };
  }
}
