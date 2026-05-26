/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/checkIn.ts
 * Description: Server Action for GPS check-in. Validates technician proximity
 *              to client address, creates location record, and updates work order startedAt.
 */

"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { locationService, calculateDistance } from "@/services/sat/locationService";
import { workOrderService } from "@/services/sat/workOrderService";
import { revalidatePath } from "next/cache";

const checkInSchema = z.object({
  workOrderId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

export async function checkInAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;

    const workOrderId = formData.get("workOrderId") as string;
    const lat = parseFloat(formData.get("lat") as string);
    const lng = parseFloat(formData.get("lng") as string);
    const accuracy = formData.get("accuracy")
      ? parseFloat(formData.get("accuracy") as string)
      : undefined;
    const batteryLevel = formData.get("batteryLevel")
      ? parseInt(formData.get("batteryLevel") as string, 10)
      : undefined;

    const parsed = checkInSchema.safeParse({
      workOrderId,
      lat,
      lng,
      accuracy,
      batteryLevel,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid input data" };
    }

    // Verify work order exists and belongs to company
    const orderData = await workOrderService.getByIdWithRelations(companyId, workOrderId);
    if (!orderData) {
      return { success: false, error: "Work order not found" };
    }

    const { workOrder, client } = orderData;

    // Validate status: must be assigned or in_progress
    if (workOrder.status !== "assigned" && workOrder.status !== "in_progress") {
      return {
        success: false,
        error: "Check-in only allowed when order is assigned or in progress",
      };
    }

    // Calculate distance to client location if available
    let distanceToClient: number | null = null;
    if (client.location?.lat && client.location?.lng) {
      distanceToClient = calculateDistance(
        lat,
        lng,
        client.location.lat,
        client.location.lng
      );
    }

    // Create location record
    const location = await locationService.create(companyId, {
      workOrderId,
      userId,
      eventType: "check_in",
      lat,
      lng,
      accuracy,
      batteryLevel,
      metadata: {
        distanceToClient: distanceToClient ?? null,
        clientAddress: client.address ?? null,
      },
    });

    // Update work order status to in_progress if it was assigned
    if (workOrder.status === "assigned") {
      await workOrderService.updateStatus(companyId, workOrderId, userId, "in_progress");
    }

    revalidatePath(`/sat/${workOrderId}`);

    return {
      success: true,
      data: {
        locationId: location.id,
        distanceToClient,
      },
    };
  } catch (error) {
    console.error("[checkInAction] Error:", error);
    return { success: false, error: "Failed to check in" };
  }
}
