/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/sat/materialService.test.ts
 * Description: Integration tests for materialService with real database.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { materialService } from "@/services/sat/materialService";
import { workOrderService } from "@/services/sat/workOrderService";
import { seedTestDatabase } from "../../../db-seed";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;
let workOrderId: string;

describe("Material Service (Integration)", () => {
  beforeAll(async () => {
    try {
      testData = await seedTestDatabase();
      hasDbConnection = true;

      const categoryId = await workOrderService.getDefaultCategoryId(
        testData.company.id
      );

      const workOrder = await workOrderService.create(
        testData.company.id,
        testData.user.id,
        {
          clientId: testData.client.id,
          categoryId,
          title: "Material Test Order",
        }
      );

      workOrderId = workOrder.id;
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  describe("add", () => {
    it("should add a material to a work order", async () => {
      if (!hasDbConnection) return;

      const material = await materialService.add(testData.company.id, {
        workOrderId,
        name: "Copper Pipe",
        quantity: 5,
        unitPrice: 12.5,
        unitCost: 8.0,
      });

      expect(material).toBeDefined();
      expect(material.name).toBe("Copper Pipe");
      expect(material.quantity).toBe("5.00");
      expect(material.unitPrice).toBe("12.50");
      expect(material.unitCost).toBe("8.00");
      expect(material.workOrderId).toBe(workOrderId);
    });

    it("should add a material without optional prices", async () => {
      if (!hasDbConnection) return;

      const material = await materialService.add(testData.company.id, {
        workOrderId,
        name: "Screws",
        quantity: 100,
      });

      expect(material.name).toBe("Screws");
      expect(material.quantity).toBe("100.00");
      expect(material.unitPrice).toBeNull();
      expect(material.unitCost).toBeNull();
    });
  });

  describe("getByWorkOrder", () => {
    it("should list materials for a work order", async () => {
      if (!hasDbConnection) return;

      const materials = await materialService.getByWorkOrder(
        testData.company.id,
        workOrderId
      );

      expect(materials.length).toBeGreaterThanOrEqual(2);
      expect(materials.some((m) => m.name === "Copper Pipe")).toBe(true);
      expect(materials.some((m) => m.name === "Screws")).toBe(true);
    });

    it("should reject listing materials from another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        materialService.getByWorkOrder("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Work order not found or access denied");
    });
  });

  describe("remove", () => {
    it("should remove a material", async () => {
      if (!hasDbConnection) return;

      const material = await materialService.add(testData.company.id, {
        workOrderId,
        name: "To Remove",
        quantity: 1,
      });

      await materialService.remove(testData.company.id, material.id);

      const materials = await materialService.getByWorkOrder(
        testData.company.id,
        workOrderId
      );

      expect(materials.some((m) => m.name === "To Remove")).toBe(false);
    });

    it("should reject removing material from another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        materialService.remove("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Material not found or access denied");
    });
  });
});
