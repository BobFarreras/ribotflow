/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/sat/signatureService.test.ts
 * Description: Integration tests for signatureService with real database and storage.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { signatureService } from "@/services/sat/signatureService";
import { workOrderService } from "@/services/sat/workOrderService";
import { seedTestDatabase } from "../../../db-seed";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;
let workOrderId: string;

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
    await workOrderService.updateStatus(testData.company.id, order.id, testData.user.id, step);
  }

  return order.id;
}

describe("Signature Service (Integration)", () => {
  beforeAll(async () => {
    try {
      testData = await seedTestDatabase();
      hasDbConnection = true;

      workOrderId = await createWorkOrder("completed");
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  describe("save", () => {
    it("should save a signature for a completed work order", async () => {
      if (!hasDbConnection) return;

      const signature = await signatureService.save(testData.company.id, {
        workOrderId,
        signedBy: "John Doe",
        signatureSvg: "<svg><path d=\"M0 0 L10 10\"/></svg>",
        signaturePngBuffer: Buffer.from("test-png-data"),
      });

      expect(signature).toBeDefined();
      expect(signature.signedBy).toBe("John Doe");
      expect(signature.signatureSvg).toBe("<svg><path d=\"M0 0 L10 10\"/></svg>");
      expect(signature.signaturePngUrl).not.toBeNull();
      expect(signature.workOrderId).toBe(workOrderId);
    });

    it("should reject saving signature for pending work order", async () => {
      if (!hasDbConnection) return;

      const pendingOrderId = await createWorkOrder("pending");

      await expect(
        signatureService.save(testData.company.id, {
          workOrderId: pendingOrderId,
          signedBy: "Jane Doe",
          signatureSvg: "<svg></svg>",
        })
      ).rejects.toThrow("Signature can only be captured when work order is completed or closed");
    });

    it("should reject saving signature for another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        signatureService.save("00000000-0000-0000-0000-000000000000", {
          workOrderId,
          signedBy: "Hacker",
          signatureSvg: "<svg></svg>",
        })
      ).rejects.toThrow("Work order not found or access denied");
    });

    it("should update existing signature", async () => {
      if (!hasDbConnection) return;

      const updated = await signatureService.save(testData.company.id, {
        workOrderId,
        signedBy: "John Updated",
        signatureSvg: "<svg><path d=\"M0 0 L20 20\"/></svg>",
      });

      expect(updated.signedBy).toBe("John Updated");
      expect(updated.signatureSvg).toBe("<svg><path d=\"M0 0 L20 20\"/></svg>");
    });
  });

  describe("getByWorkOrder", () => {
    it("should retrieve a saved signature", async () => {
      if (!hasDbConnection) return;

      const signature = await signatureService.getByWorkOrder(testData.company.id, workOrderId);

      expect(signature).not.toBeNull();
      expect(signature?.signedBy).toBe("John Updated");
    });

    it("should return null when no signature exists", async () => {
      if (!hasDbConnection) return;

      const newOrderId = await createWorkOrder("completed");
      const signature = await signatureService.getByWorkOrder(testData.company.id, newOrderId);

      expect(signature).toBeNull();
    });

    it("should reject retrieval from another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        signatureService.getByWorkOrder("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Work order not found or access denied");
    });
  });

  describe("remove", () => {
    it("should remove a signature", async () => {
      if (!hasDbConnection) return;

      const removeOrderId = await createWorkOrder("completed");
      await signatureService.save(testData.company.id, {
        workOrderId: removeOrderId,
        signedBy: "To Remove",
        signatureSvg: "<svg></svg>",
      });

      await signatureService.remove(testData.company.id, removeOrderId);

      const signature = await signatureService.getByWorkOrder(testData.company.id, removeOrderId);
      expect(signature).toBeNull();
    });

    it("should reject removal from another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        signatureService.remove("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Work order not found or access denied");
    });
  });
});
