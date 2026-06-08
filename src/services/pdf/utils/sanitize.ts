/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/utils/sanitize.ts
 * Description: Text sanitization for StandardFonts WinAnsi encoding.
 */

export function sanitizeForPdf(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/€/g, "EUR")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, "*")
    .replace(/…/g, "...")
    .replace(/[^\u0020-\u007E]/g, "");
}
