/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/actions/sat/createWorkOrder.ts
 * Descripció: Server Action per a crear una nova ordre de treball.
 */

"use server";

import { auth } from "@/lib/auth";
import { createWorkOrderSchema } from "@/lib/validators/sat/workOrderSchema";
import { workOrderService } from "@/services/sat/workOrderService";
import { createDistanceEngine } from "@/services/routing/factory";
import { db } from "@/db";
import { companies } from "@/db/schema/auth";
import { clients } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createWorkOrderAction(rawInput: unknown) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const companyId = session.user.companyId;
    const input = createWorkOrderSchema.parse(rawInput);

    const workOrder = await workOrderService.create(
      companyId,
      session.user.id as string,
      input
    );

    // Calculate travel distance from company headquarters to client
    try {
      const [company] = await db
        .select({ companyLocation: companies.companyLocation })
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      const [client] = await db
        .select({ location: clients.location })
        .from(clients)
        .where(eq(clients.id, input.clientId))
        .limit(1);

      if (company?.companyLocation && client?.location) {
        const engine = createDistanceEngine();
        const route = await engine.calculateDistance(
          company.companyLocation,
          client.location
        );

        await workOrderService.updateTravelMetrics(
          companyId,
          workOrder.id,
          route.leg.distanceMeters / 1000, // convert to km
          Math.round(route.leg.durationSeconds / 60) // convert to minutes
        );
      }
    } catch (routeError) {
      // Silently log but don't fail order creation if routing fails
      console.warn("[createWorkOrderAction] Route calculation failed:", routeError);
    }

    revalidatePath("/sat");

    return { success: true, data: workOrder };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create work order" };
  }
}
