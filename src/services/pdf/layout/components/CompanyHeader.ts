/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/CompanyHeader.ts
 * Description: Quote header with company name + NIF on left, "PRESSUPOST" + number on right.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { PAGE_W, MARGIN, COLORS } from "../../constants";
import { LABELS } from "../../labels";

export function drawCompanyHeader(
  builder: PdfBuilder,
  quoteNumber: string,
  companyName: string,
  companyTaxId: string | null
) {
  builder.ensureSpace(80);
  const startY = builder.y;

  builder.drawText(companyName, MARGIN, startY - 8, {
    bold: true,
    size: 18,
    color: COLORS.slate900,
  });
  if (companyTaxId) {
    builder.drawText(`NIF: ${companyTaxId}`, MARGIN, startY - 28, {
      size: 9,
      color: COLORS.slate500,
    });
  }

  const t = LABELS[builder.lang];
  const titleText = t.quoteDocTitle;
  const numText = `${t.quoteNum} ${quoteNumber}`;
  const titleW = builder.measureWidth(titleText, 22, true);
  const numW = builder.measureWidth(numText, 11, true);
  builder.drawText(titleText, PAGE_W - MARGIN - titleW, startY - 6, {
    bold: true,
    size: 22,
    color: COLORS.slate900,
  });
  builder.drawText(numText, PAGE_W - MARGIN - numW, startY - 30, {
    bold: true,
    size: 11,
    color: COLORS.slate600,
  });

  builder.y = startY - 46;
  builder.drawLine(builder.y, COLORS.slate200, 1);
  builder.y -= 22;
}
