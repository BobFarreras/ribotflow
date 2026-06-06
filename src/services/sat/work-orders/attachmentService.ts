/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/attachmentService.ts
 * Description: Business logic for work order attachments.
 *              Orchestrates FileStorage (binary) and PostgreSQL (metadata).
 */

import { db } from "@/db";
import { workOrderAttachments, workOrders } from "@/db/schema/sat";
import { eq, and, desc } from "drizzle-orm";
import type { AttachmentType } from "@/types/sat";
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";

interface CreateAttachmentInput {
  workOrderId: string;
  uploadedBy: string;
  type: AttachmentType;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  isBefore?: boolean;
  caption?: string;
  fileBuffer?: Buffer;
  storageKey?: string;
}

export class AttachmentService {
  constructor(private readonly storage: FileStorage) {}

  async getByWorkOrder(companyId: string, workOrderId: string) {
    const order = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (order.length === 0) {
      throw new Error("Work order not found or access denied");
    }

    return db
      .select()
      .from(workOrderAttachments)
      .where(eq(workOrderAttachments.workOrderId, workOrderId))
      .orderBy(desc(workOrderAttachments.createdAt));
  }

  async create(companyId: string, input: CreateAttachmentInput) {
    const order = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(and(eq(workOrders.id, input.workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (order.length === 0) {
      throw new Error("Work order not found or access denied");
    }

    if (!input.fileBuffer || !input.storageKey) {
      throw new Error("fileBuffer and storageKey are required");
    }

    const uploadResult = await this.storage.upload({
      buffer: input.fileBuffer,
      storageKey: input.storageKey,
      mimeType: input.mimeType || "application/octet-stream",
    });

    const [attachment] = await db
      .insert(workOrderAttachments)
      .values({
        workOrderId: input.workOrderId,
        uploadedBy: input.uploadedBy,
        type: input.type,
        fileName: input.fileName,
        storageKey: uploadResult.storageKey,
        url: uploadResult.publicUrl,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        durationSeconds: input.durationSeconds ?? null,
        isBefore: input.isBefore ?? false,
        caption: input.caption ?? null,
      })
      .returning();

    return attachment;
  }

  async remove(companyId: string, attachmentId: string) {
    const attachment = await db
      .select({
        id: workOrderAttachments.id,
        storageKey: workOrderAttachments.storageKey,
      })
      .from(workOrderAttachments)
      .innerJoin(workOrders, eq(workOrderAttachments.workOrderId, workOrders.id))
      .where(and(eq(workOrderAttachments.id, attachmentId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (attachment.length === 0) {
      throw new Error("Attachment not found or access denied");
    }

    await this.storage.delete(attachment[0].storageKey);

    await db.delete(workOrderAttachments).where(eq(workOrderAttachments.id, attachmentId));

    return { storageKey: attachment[0].storageKey };
  }
}

export const attachmentService = new AttachmentService(createFileStorage());
