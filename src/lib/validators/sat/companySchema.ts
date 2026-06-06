/**
 * Creation/modification date: 02/06/2026
 * Path: src/lib/validators/sat/companySchema.ts
 * Description: Zod validation schema for company settings (per-tenant).
 *              All fields are company-wide (tax, address, branding, preferences)
 *              but the rows themselves are always filtered by companyId at the
 *              service layer.
 */

import { z } from "zod";

const optionalString = z
  .string()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : null));

const optionalEmail = z
  .string()
  .max(255)
  .email("Email invàlid")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : null));

const optionalUrl = z
  .string()
  .max(500)
  .refine(
    (v) => !v || /^https?:\/\/.+/i.test(v) || v.startsWith("/"),
    "URL no vàlida (ha de començar amb http:// o https://)"
  )
  .optional()
  .nullable()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : null));

const optionalTaxId = z
  .string()
  .max(20)
  .regex(/^[A-Z0-9]*$/i, "Només lletres i números")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v && v.trim().length > 0 ? v.trim().toUpperCase() : null));

export const companySettingsSchema = z.object({
  // Identity
  name: z.string().min(1, "El nom és obligatori").max(200),
  taxId: optionalTaxId,
  phone: optionalString,
  email: optionalEmail,
  website: optionalUrl,

  // Address
  addressStreet: optionalString,
  addressCity: optionalString,
  addressPostalCode: optionalString,
  addressCountry: z.string().max(2).default("ES").optional(),

  // Branding
  legalText: z.string().max(2000).optional().nullable(),

  // Preferences
  defaultTaxRate: z.coerce.number().min(0, "Ha de ser ≥ 0").max(100, "Ha de ser ≤ 100").default(21),
  defaultCurrency: z
    .string()
    .length(3, "Ha de tenir 3 caràcters (ISO 4217)")
    .toUpperCase()
    .default("EUR"),
  defaultLocale: z.enum(["ca", "es", "en"]).default("ca"),
  timezone: z.string().max(50).default("Europe/Madrid").optional(),

  // Documents
  quotePrefix: z.string().min(1, "Mínim 1 caràcter").max(10).toUpperCase().default("PRE"),
  invoicePrefix: z.string().min(1, "Mínim 1 caràcter").max(10).toUpperCase().default("INV"),
  travelRatePerKm: z.coerce.number().min(0).optional().nullable(),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

/**
 * Schema for the logo upload action. Validates file metadata client-side
 * (server should re-validate mime + size before storage).
 */
export const logoUploadMetaSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.enum(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .min(1, "El fitxer és buit")
    .max(2 * 1024 * 1024, "Màxim 2 MB"),
});

export type LogoUploadMeta = z.infer<typeof logoUploadMetaSchema>;
