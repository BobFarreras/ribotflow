/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/TotalsBox.ts
 * Description: Right-aligned totals box with grand total separator.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { PAGE_W, MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";

export function drawTotalsBox(
  builder: PdfBuilder,
  subtotal: number,
  discountPercent: number,
  discountAmount: number,
  taxRate: number,
  taxAmount: number,
  total: number
) {
  builder.ensureSpace(120);
  const t = LABELS[builder.lang];
  const boxW = CONTENT_W * 0.42;
  const boxX = PAGE_W - MARGIN - boxW;
  const rowH = 18;
  const startY = builder.y;

  const rows: { label: string; value: string; color?: ReturnType<typeof import("pdf-lib").rgb> }[] =
    [{ label: `${t.subtotal}:`, value: `${subtotal.toFixed(2)} EUR` }];
  if (discountPercent > 0) {
    rows.push({
      label: `${t.discount} (${discountPercent}%):`,
      value: `-${discountAmount.toFixed(2)} EUR`,
      color: COLORS.green600,
    });
  }
  rows.push({ label: `${t.tax} (${taxRate}%):`, value: `${taxAmount.toFixed(2)} EUR` });

  let rowY = startY;
  for (const r of rows) {
    builder.drawText(r.label, boxX, rowY, { size: 9, color: r.color ?? COLORS.slate600 });
    const vW = builder.measureWidth(r.value, 9, false);
    builder.drawText(r.value, boxX + boxW - vW, rowY, {
      size: 9,
      color: r.color ?? COLORS.slate700,
    });
    rowY -= rowH;
  }

  builder.drawLine(rowY + 4, COLORS.slate900, 1.5);
  rowY -= 6;

  builder.drawText(`${t.total}:`, boxX, rowY, { bold: true, size: 12, color: COLORS.slate900 });
  const totalText = `${total.toFixed(2)} EUR`;
  const tW = builder.measureWidth(totalText, 12, true);
  builder.drawText(totalText, boxX + boxW - tW, rowY, {
    bold: true,
    size: 12,
    color: COLORS.slate900,
  });

  builder.y = rowY - 28;
}
