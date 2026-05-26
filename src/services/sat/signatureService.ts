/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/signatureService.ts
 * Description: Business logic for work order digital signatures.
 *              Orchestrates FileStorage (PNG binary) and PostgreSQL (SVG + metadata).
 */

import { db } from "@/db";
import { workOrderSignatures, workOrders } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";
import { buildSignatureStorageKey } from "@/lib/utils/storageKeys";
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";

interface SaveSignatureInput {
  workOrderId: string;
  signedBy: string;
  signatureSvg: string;
  signaturePngBuffer?: Buffer;
  ipAddress?: string;
  userAgent?: string;
  location?: { lat: number; lng: number };
}

export class SignatureService {
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

    const result = await db
      .select()
      .from(workOrderSignatures)
      .where(eq(workOrderSignatures.workOrderId, workOrderId))
      .limit(1);

    return result[0] ?? null;
  }

  async save(companyId: string, input: SaveSignatureInput) {
    // Verify work order exists and belongs to company
    const order = await db
      .select({ id: workOrders.id, status: workOrders.status, number: workOrders.number })
      .from(workOrders)
      .where(and(eq(workOrders.id, input.workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (order.length === 0) {
      throw new Error("Work order not found or access denied");
    }

    // Only allow signature when status is completed or closed
    const allowedStatuses = ["completed", "closed"];
    if (!allowedStatuses.includes(order[0].status)) {
      throw new Error("Signature can only be captured when work order is completed or closed");
    }

    // Check if signature already exists
    const existing = await db
      .select({ id: workOrderSignatures.id })
      .from(workOrderSignatures)
      .where(eq(workOrderSignatures.workOrderId, input.workOrderId))
      .limit(1);

    let pngUrl: string | null = null;

    // Upload PNG to storage if provided
    if (input.signaturePngBuffer) {
      const storageKey = buildSignatureStorageKey("sat", companyId, order[0].number);
      const uploadResult = await this.storage.upload({
        buffer: input.signaturePngBuffer,
        storageKey,
        mimeType: "image/png",
      });
      pngUrl = uploadResult.publicUrl;
    }

    if (existing.length > 0) {
      // Update existing signature
      const [updated] = await db
        .update(workOrderSignatures)
        .set({
          signedBy: input.signedBy,
          signatureSvg: input.signatureSvg,
          signaturePngUrl: pngUrl,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          location: input.location ?? null,
        })
        .where(eq(workOrderSignatures.workOrderId, input.workOrderId))
        .returning();

      return updated;
    }

    // Create new signature
    const [signature] = await db
      .insert(workOrderSignatures)
      .values({
        workOrderId: input.workOrderId,
        signedBy: input.signedBy,
        signatureSvg: input.signatureSvg,
        signaturePngUrl: pngUrl,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        location: input.location ?? null,
      })
      .returning();

    return signature;
  }

  async remove(companyId: string, workOrderId: string) {
    const order = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (order.length === 0) {
      throw new Error("Work order not found or access denied");
    }

    const signature = await db
      .select({ signaturePngUrl: workOrderSignatures.signaturePngUrl })
      .from(workOrderSignatures)
      .where(eq(workOrderSignatures.workOrderId, workOrderId))
      .limit(1);

    // Delete PNG from storage if exists
    if (signature.length > 0 && signature[0].signaturePngUrl) {
      // Extract storage key from public URL
      const url = signature[0].signaturePngUrl;
      const storageKey = url.split("/").slice(-3).join("/"); // signatures/companyId/workOrderId.png
      try {
        await this.storage.delete(storageKey);
      } catch {
        // Ignore if file already deleted
      }
    }

    await db
      .delete(workOrderSignatures)
      .where(eq(workOrderSignatures.workOrderId, workOrderId));

    return { success: true };
  }
}

export const signatureService = new SignatureService(createFileStorage());
