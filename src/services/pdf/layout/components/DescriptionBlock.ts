/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/DescriptionBlock.ts
 * Description: Description block with gray background and border.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { sanitizeForPdf } from "../../utils/sanitize";

export function drawDescriptionBlock(builder: PdfBuilder, description: string) {
  builder.ensureSpace(100);
  const t = LABELS[builder.lang];
  const topY = builder.y;
  const title = t.workDescription;
  const titleH = 20;

  const words = sanitizeForPdf(description).replace(/\r?\n/g, " ").split(" ");
  const maxW = CONTENT_W - 24;
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (builder.measureWidth(test, 10) > maxW) {
      lines++;
      line = `${word} `;
    } else {
      line = test;
    }
  }
  if (line.trim()) lines++;

  const lineH = 12;
  const pad = 12;
  const boxH = titleH + lines * lineH + pad * 2;

  builder.page.drawRectangle({
    x: MARGIN,
    y: topY - boxH,
    width: CONTENT_W,
    height: boxH,
    color: COLORS.slate50,
    borderColor: COLORS.slate200,
    borderWidth: 0.5,
  });

  builder.drawText(title, MARGIN + pad, topY - 16, {
    bold: true,
    size: 8.5,
    color: COLORS.slate500,
  });

  builder.y = topY - titleH - 4;
  builder.drawDescription(description);

  builder.y = topY - boxH - 24;
}
