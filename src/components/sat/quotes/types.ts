/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/types.ts
 * Description: Shared types for quote editor components.
 */

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  location: { lat: number; lng: number } | null;
  contactPerson: string | null;
  position: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: string | null;
  unitCost: string | null;
  stock: number | null;
}

export interface QuoteItemForm {
  id?: string;
  productId: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitCost: number | null;
  discountPercent: number;
  discountAmount: number;
  category: "material" | "labor" | "travel" | "other";
  sortOrder: number;
}

export interface ExistingQuote {
  id: string;
  number: string;
  clientId: string;
  title: string;
  description: string | null;
  status: string;
  validUntil: string | null;
  taxRate: string;
  notes: string | null;
  clientNotes: string | null;
  discountPercent: string;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    unitCost: string | null;
    discountPercent: string;
    discountAmount: string;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    total: string;
    category: string;
    sortOrder: number;
    productId: string | null;
  }>;
}

export interface Props {
  workOrderId: string;
  clients: Client[];
  products: Product[];
  workOrders?: Array<{ id: string; number: string; title: string }>;
  existingQuote?: ExistingQuote;
  mode?: "create" | "edit";
  company: CompanySummary;
}

export interface CompanySummary {
  name: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
}
