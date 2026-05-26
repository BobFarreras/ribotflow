/**
 * Creation/modification date: 26/05/2026
 * Path: src/lib/utils/storageKeys.ts
 * Description: Helpers for generating human-readable but unique storage keys.
 *              Balances readability in MinIO/S3 consoles with uniqueness.
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
 * Generate a short random suffix for uniqueness.
 */
function shortSuffix(): string {
  return randomUUID().substring(0, 8);
}

/**
 * Build a storage key for a work order attachment (photo/video).
 * Pattern: sat/{companyId}/{workOrderNumber}/{sanitizedFileName}-{shortSuffix}.{ext}
 */
export function buildAttachmentStorageKey(
  companyId: string,
  workOrderNumber: string,
  originalFileName: string
): string {
  const ext = originalFileName.includes(".")
    ? originalFileName.slice(originalFileName.lastIndexOf("."))
    : "";
  const baseName = originalFileName.includes(".")
    ? originalFileName.slice(0, originalFileName.lastIndexOf("."))
    : originalFileName;
  const cleanName = sanitizeFileName(baseName);
  const suffix = shortSuffix();
  return `sat/${companyId}/${sanitizeFileName(workOrderNumber)}/${cleanName}-${suffix}${ext}`;
}

/**
 * Build a storage key for a work order PDF.
 * Pattern: pdfs/{companyId}/{workOrderNumber}-report-{lang}.pdf
 */
export function buildPdfStorageKey(
  companyId: string,
  workOrderNumber: string,
  lang: string
): string {
  return `pdfs/${companyId}/${sanitizeFileName(workOrderNumber)}-report-${lang}.pdf`;
}

/**
 * Build a storage key for a signature PNG.
 * Pattern: signatures/{companyId}/{workOrderNumber}-signature.png
 */
export function buildSignatureStorageKey(
  companyId: string,
  workOrderNumber: string
): string {
  return `signatures/${companyId}/${sanitizeFileName(workOrderNumber)}-signature.png`;
}
