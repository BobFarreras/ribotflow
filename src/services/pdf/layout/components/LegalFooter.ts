/**
 * Creation/modification date: 02/06/2026
 * Path: src/services/pdf/layout/components/LegalFooter.ts
 * Description: Prints the tenant's legal footer text + website URL just
 *              above the standard page footer. Multi-line text is split
 *              by the caller, not by us — we trust the input is already
 *              normalised.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, COLORS } from "../../constants";

export function drawLegalFooter(
  builder: PdfBuilder,
  data: { legalText: string | null; website: string | null }
) {
  const lines: string[] = [];
  if (data.legalText && data.legalText.trim()) lines.push(data.legalText.trim());
  if (data.website && data.website.trim()) lines.push(data.website.trim());

  if (lines.length === 0) return;

  builder.ensureSpace(40);
  const startY = builder.y;

  for (const line of lines) {
    const trimmed = line.length > 130 ? line.slice(0, 127) + "…" : line;
    const w = builder.measureWidth(trimmed, 8, false);
    const x = w > 0 ? (builder.page.getWidth() - w) / 2 : MARGIN;
    builder.drawText(trimmed, x, startY - 4, {
      size: 8,
      color: COLORS.slate500,
    });
    builder.y -= 11;
  }
  builder.y -= 4;
  builder.drawLine(builder.y + 2, COLORS.slate200, 0.5);
  builder.y -= 6;
}
