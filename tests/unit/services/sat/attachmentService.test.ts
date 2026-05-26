/**
 * Creation/modification date: 26/05/2026
 * Path: tests/unit/services/sat/attachmentService.test.ts
 * Description: Integration tests for attachmentService with real database.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { attachmentService } from "@/services/sat/attachmentService";
import { workOrderService } from "@/services/sat/workOrderService";
import { seedTestDatabase } from "../../../db-seed";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;
let workOrderId: string;

describe("Attachment Service (Integration)", () => {
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
          title: "Attachment Test Order",
        }
      );

      workOrderId = workOrder.id;
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  describe("create", () => {
    it("should create an attachment record for a work order", async () => {
      if (!hasDbConnection) return;

      const attachment = await attachmentService.create(testData.company.id, {
        workOrderId,
        uploadedBy: testData.user.id,
        type: "photo",
        fileName: "test-photo.jpg",
        storageKey: `sat/${testData.company.id}/${workOrderId}/test-uuid.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 1024000,
        width: 1920,
        height: 1080,
        isBefore: true,
        caption: "Before repair",
      });

      expect(attachment).toBeDefined();
      expect(attachment.fileName).toBe("test-photo.jpg");
      expect(attachment.type).toBe("photo");
      expect(attachment.isBefore).toBe(true);
      expect(attachment.width).toBe(1920);
      expect(attachment.height).toBe(1080);
      expect(attachment.caption).toBe("Before repair");
      expect(attachment.workOrderId).toBe(workOrderId);
    });

    it("should create an attachment without optional dimensions", async () => {
      if (!hasDbConnection) return;

      const attachment = await attachmentService.create(testData.company.id, {
        workOrderId,
        uploadedBy: testData.user.id,
        type: "document",
        fileName: "invoice.pdf",
        storageKey: `sat/${testData.company.id}/${workOrderId}/doc-uuid.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 45000,
      });

      expect(attachment.type).toBe("document");
      expect(attachment.width).toBeNull();
      expect(attachment.height).toBeNull();
      expect(attachment.isBefore).toBe(false);
      expect(attachment.caption).toBeNull();
    });
  });

  describe("getByWorkOrder", () => {
    it("should list attachments for a work order", async () => {
      if (!hasDbConnection) return;

      const attachments = await attachmentService.getByWorkOrder(
        testData.company.id,
        workOrderId
      );

      expect(attachments.length).toBeGreaterThanOrEqual(2);
      expect(attachments.some((a) => a.type === "photo")).toBe(true);
      expect(attachments.some((a) => a.type === "document")).toBe(true);
    });

    it("should reject listing attachments from another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        attachmentService.getByWorkOrder("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Work order not found or access denied");
    });
  });

  describe("remove", () => {
    it("should remove an attachment", async () => {
      if (!hasDbConnection) return;

      const attachment = await attachmentService.create(testData.company.id, {
        workOrderId,
        uploadedBy: testData.user.id,
        type: "photo",
        fileName: "to-remove.jpg",
        storageKey: `sat/${testData.company.id}/${workOrderId}/remove-uuid.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 50000,
      });

      await attachmentService.remove(testData.company.id, attachment.id);

      const attachments = await attachmentService.getByWorkOrder(
        testData.company.id,
        workOrderId
      );

      expect(attachments.some((a) => a.fileName === "to-remove.jpg")).toBe(false);
    });

    it("should reject removing attachment from another company", async () => {
      if (!hasDbConnection) return;

      await expect(
        attachmentService.remove("00000000-0000-0000-0000-000000000000", workOrderId)
      ).rejects.toThrow("Attachment not found or access denied");
    });
  });
});
