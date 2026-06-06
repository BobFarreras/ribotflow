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
import { drawLegalFooter } from "../layout/components/LegalFooter";
import type { CompanyInfo, ClientInfo, QuoteItemRow } from "../types";

export interface QuotePdfData {
  quoteNumber: string;
  company: CompanyInfo;
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
  await drawCompanyHeader(builder, data.quoteNumber, data.company.name, data.company.taxId, data.company.logoUrl);
  drawInfoSection(builder, data.company, data.client, data.validUntil);

  if (data.description) drawDescriptionBlock(builder, data.description);
  if (data.items.length > 0) drawItemsTable(builder, data.items);

  drawTotalsBox(builder, data.subtotal, data.discountPercent, data.discountAmount, data.taxRate, data.taxAmount, data.total);
  if (data.conditions) drawConditionsBox(builder, data.conditions);

  await drawSignatureBlock(builder, {
    signaturePngUrl: data.signaturePngUrl,
    signedBy: data.signedBy,
    signedAt: data.signedAt,
  });

  drawLegalFooter(builder, {
    legalText: data.company.legalText,
    website: data.company.website,
  });
  builder.drawFooter();
}
