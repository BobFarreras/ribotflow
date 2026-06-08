/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/CompanyHeader.ts
 * Description: Quote header with optional logo, company name + NIF on
 *              the left, "PRESSUPOST" + number on the right. Logo is
 *              embedded from a public URL; if embedding fails the
 *              header falls back gracefully to the text-only layout.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { PAGE_W, MARGIN, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { embedImage } from "../../utils/image";

export async function drawCompanyHeader(
  builder: PdfBuilder,
  quoteNumber: string,
  companyName: string,
  companyTaxId: string | null,
  logoUrl: string | null
) {
  builder.ensureSpace(80);
  const startY = builder.y;

  const logoSize = 36;
  const logoGap = 10;
  const textOffsetX = MARGIN + (logoUrl ? logoSize + logoGap : 0);

  if (logoUrl) {
    try {
      const img = await embedImage(builder.pdfDoc, logoUrl);
      const dims = img.scaleToFit(logoSize, logoSize);
      builder.page.drawImage(img, {
        x: MARGIN,
        y: startY - dims.height,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      // Logo embedding failed (network, format). Fall through to text.
    }
  }

  builder.drawText(companyName, textOffsetX, startY - 8, {
    bold: true,
    size: 18,
    color: COLORS.slate900,
  });
  if (companyTaxId) {
    builder.drawText(`NIF: ${companyTaxId}`, textOffsetX, startY - 28, {
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
