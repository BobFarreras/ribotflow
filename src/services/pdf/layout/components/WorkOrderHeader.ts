/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/WorkOrderHeader.ts
 * Description: Dark teal banner header with RIBOTFLOW logo and work order number.
 */

import { rgb } from "pdf-lib";
import { PdfBuilder } from "../../builder/PdfBuilder";
import { PAGE_W, MARGIN, COLORS } from "../../constants";
import { LABELS } from "../../labels";

export function drawWorkOrderHeader(builder: PdfBuilder, workOrderNumber: string) {
  // Dark teal banner
  builder.page.drawRectangle({
    x: 0,
    y: builder.y - 64,
    width: PAGE_W,
    height: 80,
    color: COLORS.bgHeader,
  });

  // Logo text
  builder.drawText(LABELS[builder.lang].headerTitle, MARGIN, builder.y - 10, {
    bold: true,
    size: 22,
    color: COLORS.white,
  });

  // Subtitle
  builder.drawText(LABELS[builder.lang].headerSubtitle, MARGIN, builder.y - 34, {
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
