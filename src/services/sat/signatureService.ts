/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/signatureService.ts
 * Description: Generic digital signature business logic.
 *              Orchestrates FileStorage (PNG binary) and PostgreSQL (SVG + metadata).
 *              Works for any entity type (work_order, quote, invoice, etc.).
 */

import { db } from "@/db";
import { signatures, quotes, clients } from "@/db/schema/sat";
import { companies } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  buildWorkOrderSignatureKey,
  buildQuoteSignatureKey,
  type StorageContext,
} from "@/lib/utils/storageKeys";
import { workOrderService } from "./workOrderService";
import { quoteService } from "./quoteService";
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

  /**
   * Resolve a full StorageContext for any entity type.
   * Fetches the company (for tenantSlug) and the related client automatically.
   */
  private async resolveContext(
    companyId: string,
    entityType: SignatureEntityType,
    entityId: string
  ): Promise<StorageContext> {
    const [company] = await db
      .select({ tenantSlug: companies.tenantSlug })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    let clientId: string;
    let clientName: string;

    if (entityType === "work_order") {
      const orderData = await workOrderService.getByIdWithRelations(companyId, entityId);
      if (!orderData) throw new Error("Work order not found");
      clientId = orderData.client.id;
      clientName = orderData.client.name;
    } else if (entityType === "quote") {
      const quote = await quoteService.getById(companyId, entityId);
      if (!quote) throw new Error("Quote not found");
      const [client] = await db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.id, quote.clientId))
        .limit(1);
      if (!client) throw new Error("Client not found for this quote");
      clientId = client.id;
      clientName = client.name;
    } else {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self-hosted" ? "self-hosted" : "cloud",
      companyId,
      tenantSlug: company?.tenantSlug,
      clientId,
      clientName,
    };
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
      const ctx = await this.resolveContext(companyId, input.entityType, input.entityId);
      let storageKey: string;
      if (input.entityType === "work_order") {
        storageKey = buildWorkOrderSignatureKey(ctx, entityNumber);
      } else if (input.entityType === "quote") {
        storageKey = buildQuoteSignatureKey(ctx, entityNumber);
      } else {
        throw new Error(`Unsupported entity type: ${input.entityType}`);
      }
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
