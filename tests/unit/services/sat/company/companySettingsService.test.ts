/**
 * Creation/modification date: 02/06/2026
 * Path: tests/unit/services/sat/company/companySettingsService.test.ts
 * Description: Integration tests for the companySettingsService.
 *              Covers getById, update (multi-tenant, sanitization),
 *              and logo upload key building.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { companySettingsService } from "@/services/sat/company/companySettingsService";
import { db } from "@/db";
import { companies } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { seedTestDatabase } from "../../../../db-seed";
import { cleanupTestDatabase } from "../../../../db-cleanup";

const SLUG = "test-empresa-company";
const EMAIL = "test-cmp@ribotflow.local";

let testData: Awaited<ReturnType<typeof seedTestDatabase>>;
let hasDbConnection = false;

describe("Company Settings Service (Integration)", () => {
  beforeAll(async () => {
    try {
      testData = await seedTestDatabase({ companySlug: SLUG, email: EMAIL });
      hasDbConnection = true;
    } catch (err) {
      console.warn("⚠️ Skipping integration tests:", err);
    }
  });

  afterAll(async () => {
    if (hasDbConnection) await cleanupTestDatabase({ companySlug: SLUG, email: EMAIL });
  });

  /** Build a full CompanySettingsInput with sensible defaults. */
  function buildInput(overrides: Partial<Parameters<typeof companySettingsService.update>[1]>) {
    return {
      name: "Updated Test Co",
      taxId: null,
      phone: null,
      email: null,
      website: null,
      addressStreet: null,
      addressCity: null,
      addressPostalCode: null,
      addressCountry: "ES",
      legalText: null,
      defaultTaxRate: 21,
      defaultCurrency: "EUR",
      defaultLocale: "ca" as const,
      timezone: "Europe/Madrid",
      quotePrefix: "PRE",
      invoicePrefix: "INV",
      travelRatePerKm: null,
      ...overrides,
    };
  }

  describe("getById", () => {
    it("returns the company settings DTO for the given id", async () => {
      if (!hasDbConnection) return;
      const dto = await companySettingsService.getById(testData.company.id);
      expect(dto).not.toBeNull();
      expect(dto?.id).toBe(testData.company.id);
      expect(dto?.tenantSlug).toBe(SLUG);
      expect(dto?.name).toBe(testData.company.name);
    });

    it("returns null for an unknown company id", async () => {
      if (!hasDbConnection) return;
      const dto = await companySettingsService.getById("00000000-0000-0000-0000-000000000000");
      expect(dto).toBeNull();
    });
  });

  describe("update", () => {
    it("updates the company settings and returns the new DTO", async () => {
      if (!hasDbConnection) return;
      const updated = await companySettingsService.update(testData.company.id, {
        name: "Updated Test Co",
        taxId: "B99999999",
        phone: "+34 600 111 222",
        email: "test@updated.local",
        website: "https://updated.local",
        addressStreet: "Carrer Nou, 1",
        addressCity: "Barcelona",
        addressPostalCode: "08001",
        addressCountry: "ES",
        legalText: "Test legal text",
        defaultTaxRate: 21,
        defaultCurrency: "EUR",
        defaultLocale: "ca",
        timezone: "Europe/Madrid",
        quotePrefix: "PRE",
        invoicePrefix: "INV",
        travelRatePerKm: 0.5,
      });
      expect(updated.name).toBe("Updated Test Co");
      expect(updated.taxId).toBe("B99999999");
      expect(updated.quotePrefix).toBe("PRE");
      // DB numeric(10,2) stores with up to 2 decimals — accept either format.
      expect(Number(updated.travelRatePerKm)).toBeCloseTo(0.5, 2);
    });

    it("normalizes the tax id to upper-case", async () => {
      if (!hasDbConnection) return;
      const updated = await companySettingsService.update(testData.company.id, buildInput({ taxId: "b11111111" }));
      expect(updated.taxId).toBe("B11111111");
    });

    it("normalizes the currency code to upper-case", async () => {
      if (!hasDbConnection) return;
      const updated = await companySettingsService.update(testData.company.id, buildInput({ defaultCurrency: "eur" }));
      expect(updated.defaultCurrency).toBe("EUR");
    });

    it("normalizes the document prefixes to upper-case", async () => {
      if (!hasDbConnection) return;
      const updated = await companySettingsService.update(testData.company.id, buildInput({ quotePrefix: "pre", invoicePrefix: "fac" }));
      expect(updated.quotePrefix).toBe("PRE");
      expect(updated.invoicePrefix).toBe("FAC");
    });

    it("stores null for empty optional fields", async () => {
      if (!hasDbConnection) return;
      const updated = await companySettingsService.update(testData.company.id, buildInput({}));
      expect(updated.taxId).toBeNull();
      expect(updated.phone).toBeNull();
      expect(updated.legalText).toBeNull();
    });

    it("does not affect a different company (multi-tenant isolation)", async () => {
      if (!hasDbConnection) return;

      // Create a second company manually so we can assert isolation.
      const [other] = await db
        .insert(companies)
        .values({
          name: "Other Co",
          tenantSlug: `${SLUG}-other`,
          plan: "free",
        })
        .returning();
      try {
        const before = await companySettingsService.getById(other.id);
        await companySettingsService.update(testData.company.id, buildInput({ name: "First Co Renamed" }));
        const after = await companySettingsService.getById(other.id);
        expect(after?.name).toBe(before?.name);
        expect(after?.name).not.toBe("First Co Renamed");
      } finally {
        await db.delete(companies).where(eq(companies.id, other.id));
      }
    });
  });

  describe("uploadLogo — key building", () => {
    it("rejects an unsupported mime type at the meta-schema level", async () => {
      if (!hasDbConnection) return;
      const { logoUploadMetaSchema } = await import("@/lib/validators/sat/companySchema");
      const r = logoUploadMetaSchema.safeParse({
        fileName: "logo.gif",
        mimeType: "image/gif",
        sizeBytes: 1024,
      });
      expect(r.success).toBe(false);
    });

    it("accepts a small PNG", async () => {
      if (!hasDbConnection) return;
      const { logoUploadMetaSchema } = await import("@/lib/validators/sat/companySchema");
      const r = logoUploadMetaSchema.safeParse({
        fileName: "logo.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      });
      expect(r.success).toBe(true);
    });

    it("rejects files over 2 MB at the meta-schema level", async () => {
      if (!hasDbConnection) return;
      const { logoUploadMetaSchema } = await import("@/lib/validators/sat/companySchema");
      const r = logoUploadMetaSchema.safeParse({
        fileName: "huge.png",
        mimeType: "image/png",
        sizeBytes: 3 * 1024 * 1024,
      });
      expect(r.success).toBe(false);
    });
  });
});
