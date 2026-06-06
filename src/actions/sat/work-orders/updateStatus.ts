/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/actions/sat/updateStatus.ts
 * Descripció: Server Action per a actualitzar l'estat d'una ordre de treball.
 */

"use server";

import { auth } from "@/lib/auth";
import { updateStatusSchema } from "@/lib/validators/sat/workOrderSchema";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { notificationService } from "@/services/notifications/notificationService";
import { travelBillingService } from "@/services/billing/travelBillingService";
import { revalidatePath } from "next/cache";

export async function updateWorkOrderStatusAction(rawInput: unknown) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const companyId = session.user.companyId;
    const input = updateStatusSchema.parse(rawInput);

    const workOrder = await workOrderService.updateStatus(
      companyId,
      input.workOrderId,
      session.user.id as string,
      input.status,
      input.reason
    );

    // Send completion notification
    if (input.status === "completed") {
      try {
        const orderData = await workOrderService.getByIdWithRelations(companyId, input.workOrderId);
        if (orderData) {
          const travelCost = await travelBillingService.calculateTravelCost(
            companyId,
            input.workOrderId
          );

          await notificationService.notifyCompletion(companyId, {
            workOrderNumber: orderData.workOrder.number,
            workOrderTitle: orderData.workOrder.title,
            technicianName: session.user.name ?? "Technician",
            clientName: orderData.client.name,
            completedAt: new Date(),
            durationMinutes: orderData.workOrder.actualDurationMinutes,
            travelDistanceKm: orderData.workOrder.travelDistanceKm,
            travelCost: travelCost?.totalCost ?? null,
          });
        }
      } catch (notifyErr) {
        console.warn("[updateWorkOrderStatusAction] Notification failed:", notifyErr);
      }
    }

    revalidatePath("/sat");
    revalidatePath(`/sat/${input.workOrderId}`);

    return { success: true, data: workOrder };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update status" };
  }
}
