/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/sat/quotes/quoteCalculations.ts
 * Description: Pure calculation functions for quote items and totals.
 */

export function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  discountPercent: number,
  discountAmount: number,
  taxRate: number
) {
  const rawSubtotal = quantity * unitPrice;
  const discount = discountAmount > 0 ? discountAmount : (rawSubtotal * discountPercent) / 100;
  const subtotal = rawSubtotal - discount;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function calculateQuoteTotals(
  items: Array<{ subtotal: string | number; taxAmount: string | number; total: string | number }>
) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const taxAmount = items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
