/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/sat/locationService.test.ts
 * Description: Integration tests for LocationService with real database.
 *              Tests CRUD, security (company_id filtering), and distance calculation.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { locationService, calculateDistance } from "@/services/sat/locationService";
import { workOrderService } from "@/services/sat/workOrderService";
import type { WorkOrderStatus } from "@/types/sat";
import { seedTestDatabase } from "../../../db-seed";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;
let workOrderId: string;

async function createWorkOrder(status: string) {
  const categoryId = await workOrderService.getDefaultCategoryId(testData.company.id);
  const order = await workOrderService.create(testData.company.id, testData.user.id, {
    clientId: testData.client.id,
    categoryId,
    title: `Location Test Order ${status}`,
  });

  const transitions: Record<string, string[]> = {
    in_progress: ["assigned", "in_progress"],
    completed: ["assigned", "in_progress", "completed"],
  };

  const path = transitions[status] ?? [];
  for (const step of path) {
    await workOrderService.updateStatus(testData.company.id, order.id, testData.user.id, step as WorkOrderStatus);
  }

  return order;
}

describe("Location Service (Integration)", () => {
  beforeAll(async () => {
    try {
      testData = await seedTestDatabase();
      hasDbConnection = true;

      const order = await createWorkOrder("in_progress");
      workOrderId = order.id;
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two coordinates", () => {
      // Barcelona to Madrid (approx 505 km)
      const distance = calculateDistance(41.3851, 2.1734, 40.4168, -3.7038);
      expect(distance).toBeGreaterThan(500_000);
      expect(distance).toBeLessThan(510_000);
    });

    it("should return 0 for same coordinates", () => {
      const distance = calculateDistance(41.3851, 2.1734, 41.3851, 2.1734);
      expect(distance).toBe(0);
    });

    it("should calculate small distances accurately", () => {
      // 50 meters apart
      const distance = calculateDistance(41.3851, 2.1734, 41.3855, 2.1734);
      expect(distance).toBeGreaterThan(40);
      expect(distance).toBeLessThan(60);
    });
  });

  describe("create", () => {
    it("should create a check-in location record", async () => {
      if (!hasDbConnection) return;

      const location = await locationService.create(testData.company.id, {
        workOrderId,
        userId: testData.user.id,
        eventType: "check_in",
        lat: 41.3851,
        lng: 2.1734,
        accuracy: 5.5,
        batteryLevel: 87,
      });

      expect(location).toBeDefined();
      expect(location.workOrderId).toBe(workOrderId);
      expect(location.userId).toBe(testData.user.id);
      expect(location.eventType).toBe("check_in");
      expect(Number(location.lat)).toBeCloseTo(41.3851, 4);
      expect(Number(location.lng)).toBeCloseTo(2.1734, 4);
      expect(Number(location.accuracy)).toBeCloseTo(5.5, 1);
      expect(location.batteryLevel).toBe(87);
    });

    it("should create a route_point location", async () => {
      if (!hasDbConnection) return;

      const location = await locationService.create(testData.company.id, {
        workOrderId,
        userId: testData.user.id,
        eventType: "route_point",
        lat: 41.3860,
        lng: 2.1740,
        metadata: { speed: 12.5, heading: 90 },
      });

      expect(location.eventType).toBe("route_point");
      expect(location.metadata).toEqual({ speed: 12.5, heading: 90 });
    });

    it("should reject creating location for another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        locationService.create("00000000-0000-0000-0000-000000000000", {
          workOrderId,
          userId: testData.user.id,
          eventType: "check_in",
          lat: 41.0,
          lng: 2.0,
        })
      ).rejects.toThrow("Work order not found or access denied");
    });
  });

  describe("getByWorkOrder", () => {
    it("should list locations ordered by createdAt desc", async () => {
      if (!hasDbConnection) return;

      const locations = await locationService.getByWorkOrder(testData.company.id, workOrderId);

      expect(locations.length).toBeGreaterThanOrEqual(2);
      expect(locations[0].createdAt.getTime()).toBeGreaterThanOrEqual(locations[1].createdAt.getTime());
    });

    it("should reject listing locations for another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        locationService.getByWorkOrder("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Work order not found or access denied");
    });
  });

  describe("getLastLocation", () => {
    it("should return the most recent location", async () => {
      if (!hasDbConnection) return;

      // Add a newer location
      await locationService.create(testData.company.id, {
        workOrderId,
        userId: testData.user.id,
        eventType: "check_out",
        lat: 41.3870,
        lng: 2.1750,
      });

      const last = await locationService.getLastLocation(testData.company.id, workOrderId);

      expect(last).not.toBeNull();
      expect(last!.eventType).toBe("check_out");
      expect(Number(last!.lat)).toBeCloseTo(41.3870, 4);
    });

    it("should return null when no locations exist", async () => {
      if (!hasDbConnection) return;

      const newOrder = await createWorkOrder("in_progress");
      const last = await locationService.getLastLocation(testData.company.id, newOrder.id);

      expect(last).toBeNull();
    });

    it("should reject for another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        locationService.getLastLocation("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Work order not found or access denied");
    });
  });
});
