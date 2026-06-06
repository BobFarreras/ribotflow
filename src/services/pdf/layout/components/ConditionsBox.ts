/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/ConditionsBox.ts
 * Description: Conditions box with gray background, border, and separator.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { sanitizeForPdf } from "../../utils/sanitize";

export function drawConditionsBox(builder: PdfBuilder, notes: string) {
  builder.ensureSpace(100);
  const t = LABELS[builder.lang];
  const topY = builder.y;
  const title = t.conditionsTitle;
  const titleH = 22;

  const words = sanitizeForPdf(notes).replace(/\r?\n/g, " ").split(" ");
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

  builder.drawText(title, MARGIN + pad, topY - 16, { bold: true, size: 9, color: COLORS.slate900 });
  builder.drawLine(topY - titleH + 4, COLORS.slate200, 0.5);

  builder.y = topY - titleH - 4;
  builder.drawDescription(notes);

  builder.y = topY - boxH - 24;
}
