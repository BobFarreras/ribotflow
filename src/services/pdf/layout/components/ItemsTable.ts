/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/ItemsTable.ts
 * Description: Items table with slate-900 header and aligned columns.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import { truncateToWidth } from "../../utils/truncate";
import type { QuoteItemRow, ColDef } from "../../types";

export function drawItemsTable(builder: PdfBuilder, items: QuoteItemRow[]) {
  if (items.length === 0) return;
  builder.ensureSpace(items.length * 22 + 50);

  const t = LABELS[builder.lang];
  const cols: ColDef[] = [
    { width: 0.08, align: "center", label: t.ref },
    { width: 0.5, align: "left", label: t.itemConcept },
    { width: 0.1, align: "center", label: t.itemUnits },
    { width: 0.14, align: "right", label: t.itemUnitPriceCol },
    { width: 0.18, align: "right", label: t.itemTotalCol },
  ];

  const colXStart: number[] = [MARGIN];
  for (const c of cols) {
    colXStart.push(colXStart[colXStart.length - 1] + c.width * CONTENT_W);
  }

  const headerH = 28;
  const rowH = 22;
  const padX = 8;

  const cellX = (i: number, textW: number): number => {
    const left = colXStart[i];
    const width = cols[i].width * CONTENT_W;
    if (cols[i].align === "left") return left + padX;
    if (cols[i].align === "right") return left + width - textW - padX;
    return left + (width - textW) / 2;
  };

  // Header
  const headerTop = builder.y;
  builder.page.drawRectangle({
    x: MARGIN,
    y: headerTop - headerH + 6,
    width: CONTENT_W,
    height: headerH,
    color: COLORS.slate900,
  });

  for (let i = 0; i < cols.length; i++) {
    const textW = builder.measureWidth(cols[i].label, 8.5, true);
    builder.drawText(cols[i].label, cellX(i, textW), headerTop - 18, {
      bold: true,
      size: 8.5,
      color: COLORS.white,
    });
  }
  builder.y = headerTop - headerH;

  // Rows
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const rowTop = builder.y;

    if (idx % 2 === 1) {
      builder.page.drawRectangle({
        x: MARGIN,
        y: rowTop - rowH + 4,
        width: CONTENT_W,
        height: rowH,
        color: COLORS.slate50,
      });
    }
    builder.drawLine(rowTop - rowH + 4, COLORS.slate200, 0.5);

    // Ref
    const refText = String(idx + 1).padStart(3, "0");
    const refW = builder.measureWidth(refText, 9, false);
    builder.drawText(refText, cellX(0, refW), rowTop - 16, { size: 9, color: COLORS.slate500 });

    // Description
    const descText = truncateToWidth(
      item.description,
      cols[1].width * CONTENT_W - padX * 2,
      builder.measureWidth.bind(builder),
      9
    );
    builder.drawText(descText, cellX(1, builder.measureWidth(descText, 9, false)), rowTop - 16, {
      size: 9,
      color: COLORS.slate700,
    });

    // Units
    const unitsText = `${item.quantity} ${item.unit}`;
    const unitsW = builder.measureWidth(unitsText, 9, false);
    builder.drawText(unitsText, cellX(2, unitsW), rowTop - 16, { size: 9, color: COLORS.slate700 });

    // Unit Price
    const priceText = `${parseFloat(item.unitPrice).toFixed(2)} EUR`;
    const priceW = builder.measureWidth(priceText, 9, false);
    builder.drawText(priceText, cellX(3, priceW), rowTop - 16, { size: 9, color: COLORS.slate700 });

    // Total
    const totalText = `${parseFloat(item.total).toFixed(2)} EUR`;
    const totalW = builder.measureWidth(totalText, 9, true);
    builder.drawText(totalText, cellX(4, totalW), rowTop - 16, {
      bold: true,
      size: 9,
      color: COLORS.slate900,
    });

    builder.y -= rowH;
  }
  builder.y -= 20;
}
