/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/layout/components/InfoSection.ts
 * Description: 3-column info section (From | To | Dates) with aligned backgrounds.
 */

import { PdfBuilder } from "../../builder/PdfBuilder";
import { MARGIN, CONTENT_W, COLORS } from "../../constants";
import { LABELS } from "../../labels";
import type { CompanyInfo, ClientInfo } from "../../types";

export function drawInfoSection(
  builder: PdfBuilder,
  company: CompanyInfo,
  client: ClientInfo,
  validUntil: string | null
) {
  builder.ensureSpace(140);
  const t = LABELS[builder.lang];
  const topY = builder.y;

  const col1W = CONTENT_W * 0.30;
  const col2W = CONTENT_W * 0.35;
  const col3W = CONTENT_W * 0.31;
  const col1X = MARGIN;
  const col2X = MARGIN + col1W + 8;
  const col3X = MARGIN + col1W + col2W + 16;

  const lineH = 13;
  const pad = 10;
  const labelH = 16;

  const c1Lines = [
    company.name,
    ...(company.taxId ? [`NIF: ${company.taxId}`] : []),
    ...(company.phone ? [`Tel: ${company.phone}`] : []),
    ...(company.email ? [company.email] : []),
    ...(company.website ? [company.website] : []),
    ...(company.address ? [company.address] : []),
  ];

  const c2Lines = [
    client.name,
    ...(client.taxId ? [`NIF: ${client.taxId}`] : []),
    ...(client.address ? [client.address] : []),
    ...(client.email ? [client.email] : []),
    ...(client.phone ? [`Tel: ${client.phone}`] : []),
  ];

  const today = new Date().toLocaleDateString("ca-ES");
  const c3Lines: string[] = [];
  c3Lines.push(`${t.issueDate} ${today}`);
  if (validUntil) {
    const validDate = new Date(validUntil).toLocaleDateString("ca-ES");
    const daysLeft = Math.max(0, Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000));
    c3Lines.push(`${t.validity} ${validDate}`);
    c3Lines.push(`${t.term} ${daysLeft} ${t.days}`);
  }

  const maxLines = Math.max(c1Lines.length, c2Lines.length, c3Lines.length);
  const sectionH = labelH + maxLines * lineH + pad * 2;

  // Backgrounds
  builder.page.drawRectangle({
    x: col2X, y: topY - sectionH, width: col2W, height: sectionH,
    color: COLORS.slate50, borderColor: COLORS.slate200, borderWidth: 0.5,
  });
  builder.page.drawRectangle({
    x: col2X, y: topY - sectionH, width: 3, height: sectionH,
    color: COLORS.blue500,
  });
  builder.page.drawRectangle({
    x: col3X, y: topY - sectionH, width: col3W, height: sectionH,
    color: COLORS.slate100, borderColor: COLORS.slate200, borderWidth: 0.5,
  });

  // Labels
  builder.drawText(t.from, col1X, topY - 4, { bold: true, size: 8.5, color: COLORS.slate500 });
  builder.drawText(t.to, col2X + pad, topY - 4, { bold: true, size: 8.5, color: COLORS.slate500 });

  // Column 1
  let y1 = topY - labelH - 4;
  for (const line of c1Lines) {
    const isBold = line === company.name;
    builder.drawText(line, col1X, y1, { bold: isBold, size: 9, color: isBold ? COLORS.slate900 : COLORS.slate600 });
    y1 -= lineH;
  }

  // Column 2
  let y2 = topY - labelH - 4;
  for (const line of c2Lines) {
    const isBold = line === client.name;
    builder.drawText(line, col2X + pad, y2, { bold: isBold, size: 9, color: isBold ? COLORS.slate900 : COLORS.slate600 });
    y2 -= lineH;
  }

  // Column 3
  let y3 = topY - labelH - 4;
  for (const line of c3Lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const labelPart = line.slice(0, colonIdx + 1);
      const valuePart = line.slice(colonIdx + 1).trim();
      builder.drawText(labelPart, col3X + pad, y3, { bold: true, size: 8.5, color: COLORS.slate600 });
      const valueW = builder.measureWidth(valuePart, 9, false);
      builder.drawText(valuePart, col3X + col3W - valueW - pad, y3, { size: 9, color: COLORS.slate700 });
    } else {
      builder.drawText(line, col3X + pad, y3, { size: 9, color: COLORS.slate700 });
    }
    y3 -= lineH;
  }

  builder.y = topY - sectionH - 24;
}
