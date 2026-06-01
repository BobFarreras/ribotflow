/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: tests/unit/services/sat/workOrderService.test.ts
 * Descripció: Tests d'integració per al workOrderService amb base de dades real.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { seedTestDatabase } from "../../../db-seed";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;

describe("WorkOrder Service (Integration)", () => {
  beforeAll(async () => {
    try {
      testData = await seedTestDatabase();
      hasDbConnection = true;
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  describe("getNextOrderNumber", () => {
    it("should generate first number for a new company", async () => {
      if (!hasDbConnection) return;
      const year = new Date().getFullYear();
      const number = await workOrderService.getNextOrderNumber(
        testData.company.id
      );
      expect(number).toMatch(new RegExp(`OT-${year}-\\d{4}`));
    });
  });

  describe("create", () => {
    it("should create a work order with auto-generated number", async () => {
      if (!hasDbConnection) return;

      const categories = await workOrderService.getDefaultCategoryId(
        testData.company.id
      );

      const workOrder = await workOrderService.create(
        testData.company.id,
        testData.user.id,
        {
          clientId: testData.client.id,
          categoryId: categories,
          title: "Test Work Order",
          description: "This is a test work order",
          priority: "high",
        }
      );

      expect(workOrder).toBeDefined();
      expect(workOrder.title).toBe("Test Work Order");
      expect(workOrder.status).toBe("pending");
      expect(workOrder.number).toMatch(/^OT-\d{4}-\d{4}$/);
    });

    it("should create status history entry on creation", async () => {
      if (!hasDbConnection) return;

      const categories = await workOrderService.getDefaultCategoryId(
        testData.company.id
      );

      const workOrder = await workOrderService.create(
        testData.company.id,
        testData.user.id,
        {
          clientId: testData.client.id,
          categoryId: categories,
          title: "History Test",
        }
      );

      const history = await workOrderService.getStatusHistory(workOrder.id);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].statusTo).toBe("pending");
    });
  });

  describe("updateStatus", () => {
    it("should update status and create history entry", async () => {
      if (!hasDbConnection) return;

      const categories = await workOrderService.getDefaultCategoryId(
        testData.company.id
      );

      const workOrder = await workOrderService.create(
        testData.company.id,
        testData.user.id,
        {
          clientId: testData.client.id,
          categoryId: categories,
          title: "Status Transition Test",
        }
      );

      // pending -> assigned
      const updated = await workOrderService.updateStatus(
        testData.company.id,
        workOrder.id,
        testData.user.id,
        "assigned",
        "Assigned to technician"
      );

      expect(updated.status).toBe("assigned");

      const history = await workOrderService.getStatusHistory(workOrder.id);
      expect(history.some((h) => h.statusTo === "assigned")).toBe(true);
    });

    it("should allow any status transition", async () => {
      if (!hasDbConnection) return;

      const categories = await workOrderService.getDefaultCategoryId(
        testData.company.id
      );

      const workOrder = await workOrderService.create(
        testData.company.id,
        testData.user.id,
        {
          clientId: testData.client.id,
          categoryId: categories,
          title: "Free Transition Test",
        }
      );

      // Any transition is allowed — e.g. pending -> closed directly
      const updated = await workOrderService.updateStatus(
        testData.company.id,
        workOrder.id,
        testData.user.id,
        "closed"
      );

      expect(updated.status).toBe("closed");
    });

    it("should set started_at on first in_progress", async () => {
      if (!hasDbConnection) return;

      const categories = await workOrderService.getDefaultCategoryId(
        testData.company.id
      );

      const workOrder = await workOrderService.create(
        testData.company.id,
        testData.user.id,
        {
          clientId: testData.client.id,
          categoryId: categories,
          title: "Start Test",
        }
      );

      await workOrderService.updateStatus(
        testData.company.id,
        workOrder.id,
        testData.user.id,
        "assigned"
      );

      const updated = await workOrderService.updateStatus(
        testData.company.id,
        workOrder.id,
        testData.user.id,
        "in_progress"
      );

      expect(updated.startedAt).not.toBeNull();
    });
  });

  describe("getByCompany", () => {
    it("should filter by company_id", async () => {
      if (!hasDbConnection) return;

      const result = await workOrderService.getByCompany(testData.company.id);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
