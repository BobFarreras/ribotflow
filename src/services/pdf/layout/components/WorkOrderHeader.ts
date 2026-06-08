/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/WorkOrderHeader.ts
 * Description: Dark teal banner header with the company logo (or name
 *              as fallback) and the work order number on the right.
 *              The hardcoded "RIBOTFLOW" text has been removed; the
 *              tenant's own brand is now used.
 */

import { rgb } from "pdf-lib";
import { PdfBuilder } from "../../builder/PdfBuilder";
import { PAGE_W, MARGIN, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { embedImage } from "../../utils/image";

export async function drawWorkOrderHeader(
  builder: PdfBuilder,
  workOrderNumber: string,
  companyName: string,
  logoUrl: string | null
) {
  // Dark teal banner
  builder.page.drawRectangle({
    x: 0,
    y: builder.y - 64,
    width: PAGE_W,
    height: 80,
    color: COLORS.bgHeader,
  });

  const logoSize = 32;
  const textX = MARGIN + (logoUrl ? logoSize + 12 : 0);

  if (logoUrl) {
    try {
      const img = await embedImage(builder.pdfDoc, logoUrl);
      const dims = img.scaleToFit(logoSize, logoSize);
      // White pad behind the logo for visibility on dark banner
      builder.page.drawRectangle({
        x: MARGIN,
        y: builder.y - 56,
        width: logoSize + 8,
        height: logoSize + 8,
        color: COLORS.white,
      });
      builder.page.drawImage(img, {
        x: MARGIN + 4,
        y: builder.y - 52,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      // Fall through to text logo
    }
  }

  // Company name as the banner title
  builder.drawText(companyName, textX, builder.y - 18, {
    bold: true,
    size: 22,
    color: COLORS.white,
  });

  // Subtitle: locale-aware work order type
  builder.drawText(LABELS[builder.lang].headerSubtitle, textX, builder.y - 42, {
    size: 11,
    color: rgb(0.6, 0.85, 0.82),
  });

  // Work order number on right
  const numW = builder.measureWidth(workOrderNumber, 14, true);
  builder.drawText(workOrderNumber, PAGE_W - MARGIN - numW, builder.y - 10, {
    bold: true,
    size: 14,
    color: COLORS.white,
  });

  builder.y -= 88;
}
