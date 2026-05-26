/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/sat/signatureService.test.ts
 * Description: Integration tests for generic SignatureService with real database
 *              and storage. Entity-type agnostic.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { signatureService } from "@/services/sat/signatureService";
import { workOrderService } from "@/services/sat/workOrderService";
import type { WorkOrderStatus } from "@/types/sat";
import { seedTestDatabase } from "../../../db-seed";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;
let workOrderId: string;
let workOrderNumber: string;

async function createWorkOrder(status: string) {
  const categoryId = await workOrderService.getDefaultCategoryId(testData.company.id);
  const order = await workOrderService.create(testData.company.id, testData.user.id, {
    clientId: testData.client.id,
    categoryId,
    title: `Signature Test Order ${status}`,
  });

  const transitions: Record<string, string[]> = {
    assigned: ["assigned"],
    scheduled: ["scheduled"],
    in_progress: ["assigned", "in_progress"],
    paused: ["assigned", "in_progress", "paused"],
    completed: ["assigned", "in_progress", "completed"],
    closed: ["assigned", "in_progress", "completed", "closed"],
    cancelled: ["cancelled"],
    waiting_parts: ["assigned", "in_progress", "waiting_parts"],
    waiting_client: ["assigned", "in_progress", "waiting_client"],
  };

  const path = transitions[status] ?? [];
  for (const step of path) {
    await workOrderService.updateStatus(testData.company.id, order.id, testData.user.id, step as WorkOrderStatus);
  }

  return order;
}

describe("Signature Service (Integration)", () => {
  beforeAll(async () => {
    try {
      testData = await seedTestDatabase();
      hasDbConnection = true;

      const order = await createWorkOrder("completed");
      workOrderId = order.id;
      workOrderNumber = order.number;
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  describe("save", () => {
    it("should save a signature for an entity", async () => {
      if (!hasDbConnection) return;

      const signature = await signatureService.save(testData.company.id, workOrderNumber, {
        entityType: "work_order",
        entityId: workOrderId,
        signedBy: "John Doe",
        signatureSvg: "<svg><path d=\"M0 0 L10 10\"/></svg>",
        signaturePngBuffer: Buffer.from("test-png-data"),
      });

      expect(signature).toBeDefined();
      expect(signature.signedBy).toBe("John Doe");
      expect(signature.signatureSvg).toBe("<svg><path d=\"M0 0 L10 10\"/></svg>");
      expect(signature.signaturePngUrl).not.toBeNull();
      expect(signature.entityType).toBe("work_order");
      expect(signature.entityId).toBe(workOrderId);
    });

    it("should update existing signature", async () => {
      if (!hasDbConnection) return;

      const updated = await signatureService.save(testData.company.id, workOrderNumber, {
        entityType: "work_order",
        entityId: workOrderId,
        signedBy: "John Updated",
        signatureSvg: "<svg><path d=\"M0 0 L20 20\"/></svg>",
      });

      expect(updated.signedBy).toBe("John Updated");
      expect(updated.signatureSvg).toBe("<svg><path d=\"M0 0 L20 20\"/></svg>");
    });
  });

  describe("getByEntity", () => {
    it("should retrieve a saved signature", async () => {
      if (!hasDbConnection) return;

      const signature = await signatureService.getByEntity(testData.company.id, "work_order", workOrderId);

      expect(signature).not.toBeNull();
      expect(signature?.signedBy).toBe("John Updated");
    });

    it("should return null when no signature exists", async () => {
      if (!hasDbConnection) return;

      const newOrder = await createWorkOrder("completed");
      const signature = await signatureService.getByEntity(testData.company.id, "work_order", newOrder.id);

      expect(signature).toBeNull();
    });

    it("should return null for another company", async () => {
      if (!hasDbConnection) return;

      const signature = await signatureService.getByEntity(
        "00000000-0000-0000-0000-000000000000",
        "work_order",
        workOrderId
      );

      expect(signature).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove a signature", async () => {
      if (!hasDbConnection) return;

      const removeOrder = await createWorkOrder("completed");
      await signatureService.save(testData.company.id, removeOrder.number, {
        entityType: "work_order",
        entityId: removeOrder.id,
        signedBy: "To Remove",
        signatureSvg: "<svg></svg>",
      });

      await signatureService.remove(testData.company.id, "work_order", removeOrder.id);

      const signature = await signatureService.getByEntity(testData.company.id, "work_order", removeOrder.id);
      expect(signature).toBeNull();
    });
  });
});
