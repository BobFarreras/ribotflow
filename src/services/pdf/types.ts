/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/types.ts
 * Description: Type definitions for PDF generation domain.
 */

export type Lang = "ca" | "es" | "en";

export interface ColDef {
  width: number;
  align: "left" | "center" | "right";
  label: string;
}

export interface CompanyInfo {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  logoUrl: string | null;
  legalText: string | null;
}

export interface ClientInfo {
  name: string;
  taxId: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export interface QuoteItemRow {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  total: string;
}

export interface MaterialRow {
  name: string;
  quantity: string;
  unitPrice: string | null;
}

export interface PhotoRow {
  url: string;
  fileName: string;
  isBefore: boolean;
  caption: string | null;
}
