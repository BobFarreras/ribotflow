/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuotePdfPreview.tsx
 * Description: Professional PDF preview simulating A4 document.
 *              210mm × 297mm proportions with proper margins and flow.
 *              Orchestrator only. Sub-components in ./quotes/QuotePdfPreview/.
 */

"use client";

import { PdfHeader } from "./QuotePdfPreview/PdfHeader";
import { PdfInfoSection } from "./QuotePdfPreview/PdfInfoSection";
import { PdfDescription } from "./QuotePdfPreview/PdfDescription";
import { PdfItemsTable } from "./QuotePdfPreview/PdfItemsTable";
import { PdfTotals } from "./QuotePdfPreview/PdfTotals";
import { PdfConditions } from "./QuotePdfPreview/PdfConditions";
import { PdfSignature } from "./QuotePdfPreview/PdfSignature";
import type { CompanyData, ClientData, QuoteItem, QuoteTotals } from "./QuotePdfPreview/types";

interface Props {
  quoteNumber: string;
  company: CompanyData;
  client: ClientData;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  description: string | null;
  clientNotes: string | null;
}

export function QuotePdfPreview({
  quoteNumber,
  company,
  client,
  items,
  subtotal,
  discountPercent,
  discountAmount,
  taxRate,
  taxAmount,
  total,
  validUntil,
  description,
  clientNotes,
}: Props) {
  const totals: QuoteTotals = {
    subtotal,
    discountPercent,
    discountAmount,
    taxRate,
    taxAmount,
    total,
  };
  const validItems = items.filter((item) => item.description);
  const today = new Date().toLocaleDateString("ca-ES");
  const validUntilDate = validUntil ? new Date(validUntil).toLocaleDateString("ca-ES") : null;
  const daysLeft = validUntil
    ? Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="flex justify-center bg-gray-200 p-6">
      {/* A4 Page Simulation */}
      <div
        className="bg-white shadow-2xl"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm 15mm",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#334155",
          fontSize: "10pt",
          lineHeight: "1.5",
        }}
      >
        <PdfHeader company={company} quoteNumber={quoteNumber} />
        <PdfInfoSection
          company={company}
          client={client}
          today={today}
          validUntilDate={validUntilDate}
          daysLeft={daysLeft}
        />
        {description && <PdfDescription description={description} />}
        <PdfItemsTable items={validItems} />
        <PdfTotals totals={totals} />
        {clientNotes && <PdfConditions clientNotes={clientNotes} />}
        <PdfSignature />
      </div>
    </div>
  );
}
