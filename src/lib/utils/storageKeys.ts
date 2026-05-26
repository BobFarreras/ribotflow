/**
 * Creation/modification date: 26/05/2026
 * Path: src/lib/utils/storageKeys.ts
 * Description: Helpers for generating human-readable but unique storage keys.
 *              Balances readability in MinIO/S3 consoles with uniqueness.
 *              Supports module-based sub-routes (sat, quotes, invoices) and
 *              self-hosted mode (company name folder) vs cloud (company ID folder).
 */

import { randomUUID } from "crypto";

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
    .substring(0, 80); // max length
}

/**
 * Determine the company folder name based on deployment mode.
 * - Cloud (multi-tenant): uses companyId (immutable, safe).
 * - Self-hosted (single tenant): uses sanitized companyName for readability.
 */
function getCompanyFolder(companyId: string, companyName?: string): string {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  if (mode === "self-hosted" && companyName) {
    return sanitizeFileName(companyName);
  }
  return companyId;
}

/**
 * Generate a short random suffix for uniqueness.
 */
function shortSuffix(): string {
  return randomUUID().substring(0, 8);
}

/**
 * Build a storage key for an attachment (photo/video/document).
 * Pattern: {module}/{companyFolder}/{entityNumber}/{sanitizedFileName}-{shortSuffix}.{ext}
 */
export function buildAttachmentStorageKey(
  module: string, // e.g. "sat", "quotes", "invoices"
  companyId: string,
  entityNumber: string,
  originalFileName: string,
  companyName?: string
): string {
  const folder = getCompanyFolder(companyId, companyName);
  const ext = originalFileName.includes(".")
    ? originalFileName.slice(originalFileName.lastIndexOf("."))
    : "";
  const baseName = originalFileName.includes(".")
    ? originalFileName.slice(0, originalFileName.lastIndexOf("."))
    : originalFileName;
  const cleanName = sanitizeFileName(baseName);
  const suffix = shortSuffix();
  return `${module}/${folder}/${sanitizeFileName(entityNumber)}/${cleanName}-${suffix}${ext}`;
}

/**
 * Build a storage key for a PDF report.
 * Pattern: {module}/{companyFolder}/{entityNumber}-report-{lang}.pdf
 */
export function buildPdfStorageKey(
  module: string, // e.g. "sat", "quotes"
  companyId: string,
  entityNumber: string,
  lang: string,
  companyName?: string
): string {
  const folder = getCompanyFolder(companyId, companyName);
  return `${module}/${folder}/${sanitizeFileName(entityNumber)}-report-${lang}.pdf`;
}

/**
 * Build a storage key for a signature PNG.
 * Pattern: {module}/{companyFolder}/{entityNumber}-signature.png
 */
export function buildSignatureStorageKey(
  module: string, // e.g. "sat", "quotes"
  companyId: string,
  entityNumber: string,
  companyName?: string
): string {
  const folder = getCompanyFolder(companyId, companyName);
  return `${module}/${folder}/${sanitizeFileName(entityNumber)}-signature.png`;
}
