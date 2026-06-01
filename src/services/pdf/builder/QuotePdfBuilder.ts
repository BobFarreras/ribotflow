/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/builder/QuotePdfBuilder.ts
 * Description: Builds a quote PDF document by composing layout components.
 */

import { PdfBuilder } from "./PdfBuilder";
import { drawCompanyHeader } from "../layout/components/CompanyHeader";
import { drawInfoSection } from "../layout/components/InfoSection";
import { drawDescriptionBlock } from "../layout/components/DescriptionBlock";
import { drawItemsTable } from "../layout/components/ItemsTable";
import { drawTotalsBox } from "../layout/components/TotalsBox";
import { drawConditionsBox } from "../layout/components/ConditionsBox";
import { drawSignatureBlock } from "../layout/components/SignatureBlock";
import type { CompanyInfo, ClientInfo, QuoteItemRow } from "../types";

export interface QuotePdfData {
  quoteNumber: string;
  company: CompanyInfo & { taxId: string | null };
  client: ClientInfo;
  validUntil: string | null;
  description: string | null;
  items: QuoteItemRow[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  conditions: string | null;
  signaturePngUrl?: string | null;
  signedBy?: string | null;
  signedAt?: Date | null;
}

export async function buildQuotePdf(builder: PdfBuilder, data: QuotePdfData) {
  // Header
  drawCompanyHeader(builder, data.quoteNumber, data.company.name, data.company.taxId);

  // Info section
  drawInfoSection(builder, data.company, data.client, data.validUntil);

  // Description
  if (data.description) {
    drawDescriptionBlock(builder, data.description);
  }

  // Items table
  if (data.items.length > 0) {
    drawItemsTable(builder, data.items);
  }

  // Totals
  drawTotalsBox(
    builder,
    data.subtotal,
    data.discountPercent,
    data.discountAmount,
    data.taxRate,
    data.taxAmount,
    data.total
  );

  // Conditions
  if (data.conditions) {
    drawConditionsBox(builder, data.conditions);
  }

  // Signature
  await drawSignatureBlock(builder, {
    signaturePngUrl: data.signaturePngUrl,
    signedBy: data.signedBy,
    signedAt: data.signedAt,
  });

  // Footer
  builder.drawFooter();
}
