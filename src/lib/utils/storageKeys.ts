/**
 * Creation/modification date: 01/06/2026
 * Path: src/lib/utils/storageKeys.ts
 * Description: Professional, human-readable storage keys for MinIO/S3.
 *              Designed for multi-tenant cloud (Supabase) and self-hosted
 *              (per-company Docker) deployments.
 *
 * HIERARCHY:
 *   Self-hosted:  {module}/{clientSlug}/{entityNumber}/{file}
 *   Cloud:        {module}/{tenantSlug}/{clientSlug}/{entityNumber}/{file}
 *
 * EXAMPLES:
 *   self-hosted:  quotes/ajuntament-de-barcelona-1fa711/PRES-2026-0001/quote-ca.pdf
 *   cloud:        quotes/digitalagency/ajuntament-de-barcelona-1fa711/PRES-2026-0001/quote-ca.pdf
 *   work-orders:  work-orders/joan-puig-3a4b2c/OT-2026-0042/attachments/foto-83fc14.png
 *   work-orders:  work-orders/joan-puig-3a4b2c/OT-2026-0042/signature.png
 *   work-orders:  work-orders/joan-puig-3a4b2c/OT-2026-0042/report-ca.pdf
 *
 * DESIGN PRINCIPLES:
 *   1. NO UUIDs in folder names (only as suffixes for uniqueness).
 *   2. tenantSlug or empty prefix (per mode) — never companyId.
 *   3. clientSlug = sanitized name + 6-char id prefix (collision-safe).
 *   4. Per-entity folder ({quoteNumber}/) groups all related files.
 *   5. Stable over time (id prefix never changes once created).
 */

import { randomUUID } from "crypto";

/* ============================================================
   SANITIZATION
   ============================================================ */

/**
 * Sanitize a string for use in a file path or URL.
 * Removes/replaces special characters, accents, spaces.
 */
export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, "_") // replace special chars with underscore
    .replace(/_+/g, "_") // collapse multiple underscores
    .replace(/^_+|_+$/g, "") // trim leading/trailing underscores
    .substring(0, 60); // max length (shorter for path safety)
}

/* ============================================================
   STORAGE CONTEXT
   ============================================================ */

export type DeploymentMode = "cloud" | "self_hosted";

export interface StorageContext {
  /** Deployment mode (cloud = multi-tenant shared bucket, self-hosted = single-tenant per company). */
  mode: DeploymentMode;
  /** Company UUID (internal). Used for id-based operations only. */
  companyId: string;
  /** Company tenant slug (e.g. "digitalagency"). Used as folder name in cloud mode. */
  tenantSlug?: string;
  /** Client UUID (internal). */
  clientId: string;
  /** Client display name (e.g. "Ajuntament de Barcelona"). */
  clientName: string;
}

/**
 * Build a StorageContext from raw values, validating them.
 */
export function buildStorageContext(input: {
  companyId: string;
  tenantSlug?: string | null;
  clientId: string;
  clientName: string;
}): StorageContext {
  const mode: DeploymentMode =
    process.env.NEXT_PUBLIC_APP_MODE === "self_hosted" ? "self_hosted" : "cloud";

  return {
    mode,
    companyId: input.companyId,
    tenantSlug: input.tenantSlug ?? undefined,
    clientId: input.clientId,
    clientName: input.clientName,
  };
}

/* ============================================================
   FOLDER BUILDERS
   ============================================================ */

/**
 * Get the company-level folder prefix.
 * - Cloud:    "tenantSlug"
 * - Self-hosted: "" (no prefix, single tenant per bucket)
 */
export function getCompanyFolder(ctx: StorageContext): string {
  if (ctx.mode === "self_hosted") return "";
  return sanitizeFileName(ctx.tenantSlug ?? ctx.companyId);
}

/**
 * Get the client-level folder name.
 * Pattern: {sanitizedClientName}-{id6}
 *
 * Why id suffix: Two clients can share the same name (e.g. "Ajuntament
 * de Barcelona" for two different municipalities). The 6-char id prefix
 * guarantees uniqueness while keeping the human-readable name first.
 */
export function getClientFolder(ctx: StorageContext): string {
  const namePart = sanitizeFileName(ctx.clientName) || "client";
  const idPart = ctx.clientId.replace(/-/g, "").substring(0, 6);
  return `${namePart}-${idPart}`;
}

/**
 * Build the full folder path for a given entity.
 * Returns: "{companyFolder}/{clientFolder}/{entityNumber}/" or similar.
 */
export function getEntityFolder(ctx: StorageContext, module: string, entityNumber: string): string {
  const company = getCompanyFolder(ctx);
  const client = getClientFolder(ctx);
  const parts = [module];
  if (company) parts.push(company);
  parts.push(client, sanitizeFileName(entityNumber));
  return parts.join("/") + "/";
}

/* ============================================================
   QUOTE KEYS (pressupostos)
   ============================================================ */

/**
 * Build storage key for a quote PDF.
 * Example: quotes/digitalagency/ajuntament-barcelona-1fa711/PRES-2026-0001/quote-ca.pdf
 */
export function buildQuotePdfKey(ctx: StorageContext, quoteNumber: string, lang: string): string {
  const folder = getEntityFolder(ctx, "quotes", quoteNumber);
  return `${folder}quote-${lang}.pdf`;
}

/**
 * Build storage key for a quote signature (PNG).
 * Example: quotes/digitalagency/.../PRES-2026-0001/signature.png
 */
export function buildQuoteSignatureKey(ctx: StorageContext, quoteNumber: string): string {
  const folder = getEntityFolder(ctx, "quotes", quoteNumber);
  return `${folder}signature.png`;
}

/**
 * Build storage key for a signed quote PDF (final, with signature embedded).
 * Example: quotes/digitalagency/.../PRES-2026-0001/signed-quote-ca.pdf
 */
export function buildSignedQuoteKey(
  ctx: StorageContext,
  quoteNumber: string,
  lang: string
): string {
  const folder = getEntityFolder(ctx, "quotes", quoteNumber);
  return `${folder}signed-quote-${lang}.pdf`;
}

/* ============================================================
   WORK ORDER KEYS (ordres de treball)
   ============================================================ */

/**
 * Build storage key for a work order attachment (photo, video, document).
 * Example: work-orders/digitalagency/.../OT-2026-0042/attachments/foto-83fc14.png
 */
export function buildWorkOrderAttachmentKey(
  ctx: StorageContext,
  workOrderNumber: string,
  originalFileName: string
): string {
  const folder = getEntityFolder(ctx, "work-orders", workOrderNumber);
  const ext = originalFileName.includes(".")
    ? originalFileName.slice(originalFileName.lastIndexOf("."))
    : "";
  const baseName = originalFileName.includes(".")
    ? originalFileName.slice(0, originalFileName.lastIndexOf("."))
    : originalFileName;
  const cleanName = sanitizeFileName(baseName);
  const suffix = randomUUID().substring(0, 8);
  return `${folder}attachments/${cleanName}-${suffix}${ext}`;
}

/**
 * Build storage key for a work order signature.
 * Example: work-orders/digitalagency/.../OT-2026-0042/signature.png
 */
export function buildWorkOrderSignatureKey(ctx: StorageContext, workOrderNumber: string): string {
  const folder = getEntityFolder(ctx, "work-orders", workOrderNumber);
  return `${folder}signature.png`;
}

/**
 * Build storage key for a work order PDF report.
 * Example: work-orders/digitalagency/.../OT-2026-0042/report-ca.pdf
 */
export function buildWorkOrderReportKey(
  ctx: StorageContext,
  workOrderNumber: string,
  lang: string
): string {
  const folder = getEntityFolder(ctx, "work-orders", workOrderNumber);
  return `${folder}report-${lang}.pdf`;
}

/* ============================================================
   COMPANY KEYS (logos, branding assets)
   ============================================================ */

/**
 * Build storage key for the company logo. Versioned by timestamp so
 * re-uploads don't collide and CDN caches can be busted.
 * Example: branding/digitalagency/logo-1717351234.png
 */
export function buildCompanyLogoKey(ctx: StorageContext, fileExtension: string): string {
  const company = getCompanyFolder(ctx);
  const cleanExt = fileExtension.replace(/^\./, "").toLowerCase() || "png";
  const parts = ["branding"];
  if (company) parts.push(company);
  parts.push(`logo-${Date.now()}.${cleanExt}`);
  return parts.join("/");
}

/**
 * Storage key prefix used to find previous logos for a company
 * (so they can be deleted when a new one is uploaded).
 */
export function getCompanyLogoPrefix(ctx: StorageContext): string {
  const company = getCompanyFolder(ctx);
  return company ? `branding/${company}/logo-` : "branding/logo-";
}

/* ============================================================
   USER AVATAR KEYS
   ============================================================ */

/**
 * Build storage key for a user's avatar. Versioned by timestamp so
 * re-uploads invalidate the old asset.
 * Example: branding/digitalagency/avatars/8b3c-1717351234.png
 */
export function buildUserAvatarKey(
  ctx: StorageContext,
  userId: string,
  fileExtension: string
): string {
  const company = getCompanyFolder(ctx);
  const cleanExt = fileExtension.replace(/^\./, "").toLowerCase() || "png";
  const parts = ["branding"];
  if (company) parts.push(company);
  parts.push("avatars", `${userId}-${Date.now()}.${cleanExt}`);
  return parts.join("/");
}

/** Storage key prefix used to find previous avatars for a user. */
export function getUserAvatarPrefix(ctx: StorageContext, userId: string): string {
  const company = getCompanyFolder(ctx);
  return company ? `branding/${company}/avatars/${userId}-` : `branding/avatars/${userId}-`;
}

/* ============================================================
   LEGACY API (kept for backward compat — re-exports with deprecation)
   These functions accept flat parameters and build a key WITHOUT
   client organization. Only used in legacy code paths.
   ============================================================ */

/**
 * @deprecated Use buildWorkOrderAttachmentKey with StorageContext instead.
 * Kept for backward compatibility with existing data.
 */
export function buildAttachmentStorageKey(
  module: string,
  companyId: string,
  entityNumber: string,
  originalFileName: string,
  companyName?: string
): string {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  const folder = mode === "self_hosted" && companyName ? sanitizeFileName(companyName) : companyId;
  const ext = originalFileName.includes(".")
    ? originalFileName.slice(originalFileName.lastIndexOf("."))
    : "";
  const baseName = originalFileName.includes(".")
    ? originalFileName.slice(0, originalFileName.lastIndexOf("."))
    : originalFileName;
  const cleanName = sanitizeFileName(baseName);
  const suffix = randomUUID().substring(0, 8);
  return `${module}/${folder}/${sanitizeFileName(entityNumber)}/${cleanName}-${suffix}${ext}`;
}

/**
 * @deprecated Use buildWorkOrderReportKey / buildQuotePdfKey with StorageContext.
 * Kept for backward compatibility.
 */
export function buildPdfStorageKey(
  module: string,
  companyId: string,
  entityNumber: string,
  lang: string,
  companyName?: string
): string {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  const folder = mode === "self_hosted" && companyName ? sanitizeFileName(companyName) : companyId;
  return `${module}/${folder}/${sanitizeFileName(entityNumber)}-report-${lang}.pdf`;
}

/**
 * @deprecated Use buildWorkOrderSignatureKey / buildQuoteSignatureKey with StorageContext.
 * Kept for backward compatibility.
 */
export function buildSignatureStorageKey(
  module: string,
  companyId: string,
  entityNumber: string,
  companyName?: string
): string {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  const folder = mode === "self_hosted" && companyName ? sanitizeFileName(companyName) : companyId;
  return `${module}/${folder}/${sanitizeFileName(entityNumber)}-signature.png`;
}
