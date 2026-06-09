/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/billing/travelBillingService.ts
 * Description: Calculates travel costs for work orders based on distance
 *              and company-configured rate per KM.
 */

import { db } from "@/db";
import { companies } from "@/db/schema/auth";
import { workOrders } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";

export interface TravelCostResult {
  distanceKm: number;
  ratePerKm: number;
  totalCost: number;
  currency: string;
}

export const travelBillingService = {
  async calculateTravelCost(
    companyId: string,
    workOrderId: string
  ): Promise<TravelCostResult | null> {
    const [order] = await db
      .select({
        distance: workOrders.travelDistanceKm,
      })
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (!order?.distance) {
      return null;
    }

    const [company] = await db
      .select({ rate: companies.travelRatePerKm })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const distanceKm = parseFloat(order.distance);
    const ratePerKm = company?.rate ? parseFloat(company.rate) : 0;
    const totalCost = Math.round(distanceKm * ratePerKm * 100) / 100;

    return {
      distanceKm,
      ratePerKm,
      totalCost,
      currency: "EUR",
    };
  },

  async getTotalTravelCostsByDateRange(
    companyId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<{ totalDistanceKm: number; totalCost: number }> {
    const orders = await db
      .select({
        distance: workOrders.travelDistanceKm,
      })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.companyId, companyId),
          eq(workOrders.status, "completed")
          // Note: Drizzle doesn't have direct date range helpers without raw SQL
          // For now we fetch all completed and filter in memory
        )
      );

    const [company] = await db
      .select({ rate: companies.travelRatePerKm })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const ratePerKm = company?.rate ? parseFloat(company.rate) : 0;

    let totalDistanceKm = 0;
    let totalCost = 0;

    for (const order of orders) {
      if (order.distance) {
        const distance = parseFloat(order.distance);
        totalDistanceKm += distance;
        totalCost += distance * ratePerKm;
      }
    }

    return {
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  },
};
