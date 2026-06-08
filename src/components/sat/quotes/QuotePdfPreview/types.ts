/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuotePdfPreview/types.ts
 * Description: Shared types for the QuotePdfPreview component.
 */

export interface CompanyData {
  name: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string | null;
  website?: string | null;
}

export interface ClientData {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
}

export interface QuoteTotals {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}
