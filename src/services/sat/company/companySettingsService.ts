/**
 * Creation/modification date: 02/06/2026
 * Path: src/services/sat/company/companySettingsService.ts
 * Description: Service for per-company settings (identity, address,
 *              preferences, documents, branding). The DTO mirrors the DB
 *              row but with `companyId` exposed for client-side routing.
 *              All operations are multi-tenant: every call filters by
 *              the companyId from the session/parameter.
 */

import { db } from "@/db";
import { companies, type CompanyRow } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { createFileStorage } from "@/services/storage/factory";
import {
  buildStorageContext,
  buildCompanyLogoKey,
  getCompanyLogoPrefix,
  sanitizeFileName,
} from "@/lib/utils/storageKeys";
import {
  logoUploadMetaSchema,
  type CompanySettingsInput,
} from "@/lib/validators/sat/companySchema";

export interface CompanySettingsDTO {
  id: string;
  name: string;
  tenantSlug: string;
  plan: "free" | "plus" | "enterprise";
  taxId: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressCountry: string;
  logoUrl: string | null;
  legalText: string | null;
  defaultTaxRate: string;
  defaultCurrency: string;
  defaultLocale: string;
  timezone: string;
  quotePrefix: string;
  invoicePrefix: string;
  travelRatePerKm: string | null;
  updatedAt: Date;
}

function rowToDto(row: CompanyRow): CompanySettingsDTO {
  return {
    id: row.id,
    name: row.name,
    tenantSlug: row.tenantSlug,
    plan: row.plan,
    taxId: row.taxId,
    phone: row.phone,
    email: row.email,
    website: row.website,
    addressStreet: row.addressStreet,
    addressCity: row.addressCity,
    addressPostalCode: row.addressPostalCode,
    addressCountry: row.addressCountry ?? "ES",
    logoUrl: row.logoUrl,
    legalText: row.legalText,
    defaultTaxRate: row.defaultTaxRate ?? "21",
    defaultCurrency: row.defaultCurrency ?? "EUR",
    defaultLocale: row.defaultLocale ?? "ca",
    timezone: row.timezone ?? "Europe/Madrid",
    quotePrefix: row.quotePrefix ?? "PRE",
    invoicePrefix: row.invoicePrefix ?? "INV",
    travelRatePerKm: row.travelRatePerKm,
    updatedAt: row.updatedAt,
  };
}

export const companySettingsService = {
  async getById(companyId: string): Promise<CompanySettingsDTO | null> {
    const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    const row = rows[0];
    return row ? rowToDto(row) : null;
  },

  async update(companyId: string, input: CompanySettingsInput): Promise<CompanySettingsDTO> {
    const upper = (s: string | null | undefined) =>
      s && s.trim().length > 0 ? s.trim().toUpperCase() : null;

    const updated = await db
      .update(companies)
      .set({
        name: input.name,
        taxId: upper(input.taxId),
        phone: input.phone ?? null,
        email: input.email ?? null,
        website: input.website ?? null,
        addressStreet: input.addressStreet ?? null,
        addressCity: input.addressCity ?? null,
        addressPostalCode: input.addressPostalCode ?? null,
        addressCountry: input.addressCountry ?? "ES",
        legalText: input.legalText ?? null,
        defaultTaxRate: String(input.defaultTaxRate ?? 21),
        defaultCurrency: upper(input.defaultCurrency) ?? "EUR",
        defaultLocale: input.defaultLocale ?? "ca",
        timezone: input.timezone ?? "Europe/Madrid",
        quotePrefix: upper(input.quotePrefix) ?? "PRE",
        invoicePrefix: upper(input.invoicePrefix) ?? "INV",
        travelRatePerKm: input.travelRatePerKm != null ? String(input.travelRatePerKm) : null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();
    return rowToDto(updated[0]);
  },

  /**
   * Uploads a company logo to the configured storage provider (MinIO/Supabase/Local).
   * Deletes any previous logo for the same company. Returns the public URL
   * to be stored in `companies.logoUrl`.
   */
  async uploadLogo(
    companyId: string,
    tenantSlug: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ publicUrl: string; storageKey: string }> {
    const meta = logoUploadMetaSchema.parse({ fileName, mimeType, sizeBytes: buffer.length });
    const ext = meta.fileName.includes(".")
      ? meta.fileName.slice(meta.fileName.lastIndexOf(".") + 1)
      : (meta.mimeType.split("/")[1] ?? "png");
    const safeExt = sanitizeFileName(ext.toLowerCase());

    const ctx = buildStorageContext({
      companyId,
      tenantSlug,
      clientId: companyId,
      clientName: tenantSlug,
    });
    const storageKey = buildCompanyLogoKey(ctx, safeExt);
    const storage = createFileStorage();

    // Try to remove the old logo (best-effort).
    try {
      const previousKey = await this.findPreviousLogoKey(storage, ctx);
      if (previousKey) await storage.delete(previousKey);
    } catch {
      // Non-fatal: storage may be empty or unavailable.
    }

    const uploaded = await storage.upload({
      buffer,
      storageKey,
      mimeType: meta.mimeType,
      metadata: { companyId, uploadedAt: new Date().toISOString() },
    });

    return { publicUrl: uploaded.publicUrl, storageKey: uploaded.storageKey };
  },

  /**
   * Best-effort: find the previous logo storage key by listing the
   * company prefix and picking the most recent one. Returns null if
   * listing isn't supported by the underlying storage.
   */
  async findPreviousLogoKey(
    storage: ReturnType<typeof createFileStorage>,
    ctx: ReturnType<typeof buildStorageContext>
  ): Promise<string | null> {
    if (typeof (storage as { listObjects?: unknown }).listObjects === "function") {
      const prefix = getCompanyLogoPrefix(ctx);
      const keys = await (
        storage as unknown as { listObjects: (p: string) => Promise<string[]> }
      ).listObjects(prefix);
      if (keys.length === 0) return null;
      keys.sort();
      return keys[keys.length - 1];
    }
    return null;
  },
};
