/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/signatureService.ts
 * Description: Generic digital signature business logic.
 *              Orchestrates FileStorage (PNG binary) and PostgreSQL (SVG + metadata).
 *              Works for any entity type (work_order, quote, invoice, etc.).
 */

import { db } from "@/db";
import { signatures } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";
import { buildSignatureStorageKey } from "@/lib/utils/storageKeys";
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";

export type SignatureEntityType = "work_order" | "quote" | "invoice";

export interface SaveSignatureInput {
  entityType: SignatureEntityType;
  entityId: string;
  signedBy: string;
  signatureSvg: string;
  signaturePngBuffer?: Buffer;
  ipAddress?: string;
  userAgent?: string;
  location?: { lat: number; lng: number };
}

export class SignatureService {
  constructor(private readonly storage: FileStorage) {}

  async getByEntity(
    companyId: string,
    entityType: SignatureEntityType,
    entityId: string
  ) {
    const result = await db
      .select()
      .from(signatures)
      .where(
        and(
          eq(signatures.companyId, companyId),
          eq(signatures.entityType, entityType),
          eq(signatures.entityId, entityId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  async save(companyId: string, entityNumber: string, input: SaveSignatureInput) {
    // Check if signature already exists for this entity
    const existing = await db
      .select({ id: signatures.id })
      .from(signatures)
      .where(
        and(
          eq(signatures.companyId, companyId),
          eq(signatures.entityType, input.entityType),
          eq(signatures.entityId, input.entityId)
        )
      )
      .limit(1);

    let pngUrl: string | null = null;

    // Upload PNG to storage if provided
    if (input.signaturePngBuffer) {
      const storageKey = buildSignatureStorageKey(
        input.entityType,
        companyId,
        entityNumber
      );
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
        .update(signatures)
        .set({
          signedBy: input.signedBy,
          signatureSvg: input.signatureSvg,
          signaturePngUrl: pngUrl,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          location: input.location ?? null,
        })
        .where(eq(signatures.id, existing[0].id))
        .returning();

      return updated;
    }

    // Create new signature
    const [signature] = await db
      .insert(signatures)
      .values({
        companyId,
        entityType: input.entityType,
        entityId: input.entityId,
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

  async remove(
    companyId: string,
    entityType: SignatureEntityType,
    entityId: string
  ) {
    const signature = await db
      .select({ signaturePngUrl: signatures.signaturePngUrl })
      .from(signatures)
      .where(
        and(
          eq(signatures.companyId, companyId),
          eq(signatures.entityType, entityType),
          eq(signatures.entityId, entityId)
        )
      )
      .limit(1);

    // Delete PNG from storage if exists
    if (signature.length > 0 && signature[0].signaturePngUrl) {
      // Extract storage key from public URL
      const url = signature[0].signaturePngUrl;
      const storageKey = url.split("/").slice(-3).join("/");
      try {
        await this.storage.delete(storageKey);
      } catch {
        // Ignore if file already deleted
      }
    }

    await db
      .delete(signatures)
      .where(
        and(
          eq(signatures.companyId, companyId),
          eq(signatures.entityType, entityType),
          eq(signatures.entityId, entityId)
        )
      );

    return { success: true };
  }
}

export const signatureService = new SignatureService(createFileStorage());
