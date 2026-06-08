/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/utils/truncate.ts
 * Description: Text truncation helper for fixed-width PDF cells.
 */

import { sanitizeForPdf } from "./sanitize";

export function truncateToWidth(
  text: string,
  maxWidth: number,
  measureWidth: (text: string, size: number, bold: boolean) => number,
  size: number
): string {
  const safe = sanitizeForPdf(text);
  if (measureWidth(safe, size, false) <= maxWidth) return safe;
  let truncated = safe;
  while (truncated.length > 0 && measureWidth(truncated + "...", size, false) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
}
