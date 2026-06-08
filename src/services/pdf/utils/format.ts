/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/utils/format.ts
 * Description: Pure formatting helpers for PDF content.
 */

export function fmtDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ca-ES");
}

export function fmtCurrency(value: string | null): string {
  if (!value) return "-";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)} EUR`;
}
