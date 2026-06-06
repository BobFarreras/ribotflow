/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/sat/quotes/index.ts
 * Description: Barrel export for the quotes sub-domain.
 */

export { quoteService } from "./quoteService";
export { quoteItemService } from "./quoteItemService";
export { quoteTemplateService } from "./quoteTemplateService";
export { calculateItemTotals, calculateQuoteTotals } from "./quoteCalculations";
export { getNextQuoteNumber } from "./quoteNumber";
