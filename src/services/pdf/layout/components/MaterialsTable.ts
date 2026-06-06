/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/MaterialsTable.ts
 * Description: Materials table with alternating row backgrounds for work order PDFs.
 */

import { rgb } from "pdf-lib";
import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { fmtCurrency } from "../../utils/format";
import type { MaterialRow } from "../../types";

export function drawMaterialsTable(builder: PdfBuilder, materials: MaterialRow[]) {
  if (materials.length === 0) return;

  const cols = [MARGIN, MARGIN + 230, MARGIN + 310, MARGIN + 390, MARGIN + 460];
  const rowH = 18;

  builder.ensureSpace(materials.length * rowH + 34);
  builder.drawRect(MARGIN, builder.y + 4, CONTENT_W, rowH, COLORS.primaryLight);

  // Headers
  const t = LABELS[builder.lang];
  builder.drawText(t.name, cols[0] + 4, builder.y, {
    bold: true,
    size: 9,
    color: COLORS.primaryDark,
  });
  builder.drawText(t.qty, cols[1] + 4, builder.y, {
    bold: true,
    size: 9,
    color: COLORS.primaryDark,
  });
  builder.drawText(t.unitPrice, cols[2] + 4, builder.y, {
    bold: true,
    size: 9,
    color: COLORS.primaryDark,
  });
  builder.drawText(t.lineTotal, cols[3] + 4, builder.y, {
    bold: true,
    size: 9,
    color: COLORS.primaryDark,
  });
  builder.addSpace(rowH);

  let grandTotal = 0;
  for (let idx = 0; idx < materials.length; idx++) {
    const mat = materials[idx];
    if (idx % 2 !== 0) {
      builder.drawRect(MARGIN, builder.y + 4, CONTENT_W, rowH, rgb(0.97, 0.97, 0.98));
    }

    const qty = parseFloat(String(mat.quantity));
    const price = mat.unitPrice ? parseFloat(mat.unitPrice) : 0;
    const lineTotal = qty * price;
    grandTotal += lineTotal;

    builder.drawText(mat.name, cols[0] + 4, builder.y, { size: 9 });
    builder.drawText(String(mat.quantity), cols[1] + 4, builder.y, { size: 9 });
    builder.drawText(fmtCurrency(mat.unitPrice), cols[2] + 4, builder.y, { size: 9 });
    builder.drawText(`${lineTotal.toFixed(2)} EUR`, cols[3] + 4, builder.y, { size: 9 });

    builder.addSpace(rowH);
  }

  // Total row
  builder.drawLine(builder.y + 4, COLORS.border, 0.5);
  builder.addSpace(6);
  builder.drawText(`${t.total}:`, cols[2] + 4, builder.y, { bold: true, size: 10 });
  builder.drawText(`${grandTotal.toFixed(2)} EUR`, cols[3] + 4, builder.y, {
    bold: true,
    size: 10,
    color: COLORS.primaryDark,
  });
  builder.addSpace(14);
}
