/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/locationService.ts
 * Description: Work order location tracking service. Handles check-in, check-out,
 *              route points and location updates with company_id security.
 */

import { db } from "@/db";
import { workOrderLocations, workOrders } from "@/db/schema/sat";
import { eq, and, desc } from "drizzle-orm";
import type { LocationEventType } from "@/types/sat";
export { calculateDistance } from "@/lib/utils/geo";

export interface CreateLocationInput {
  workOrderId: string;
  userId: string;
  eventType: LocationEventType;
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  batteryLevel?: number;
  metadata?: Record<string, unknown>;
}

export const locationService = {
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
      .from(workOrderLocations)
      .where(eq(workOrderLocations.workOrderId, workOrderId))
      .orderBy(desc(workOrderLocations.createdAt));
  },

  async create(companyId: string, input: CreateLocationInput) {
    // Security: verify the work order belongs to the company
    const order = await db
      .select({ id: workOrders.id, clientId: workOrders.clientId })
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

    const [location] = await db
      .insert(workOrderLocations)
      .values({
        workOrderId: input.workOrderId,
        userId: input.userId,
        eventType: input.eventType,
        lat: String(input.lat),
        lng: String(input.lng),
        accuracy: input.accuracy ? String(input.accuracy) : null,
        altitude: input.altitude ? String(input.altitude) : null,
        batteryLevel: input.batteryLevel ?? null,
        metadata: input.metadata ?? null,
      })
      .returning();

    return location;
  },

  async getLastLocation(companyId: string, workOrderId: string) {
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

    const result = await db
      .select()
      .from(workOrderLocations)
      .where(eq(workOrderLocations.workOrderId, workOrderId))
      .orderBy(desc(workOrderLocations.createdAt))
      .limit(1);

    return result[0] ?? null;
  },
};
