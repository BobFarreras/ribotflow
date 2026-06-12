/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/builder/PdfBuilder.ts
 * Description: Base PDF builder with low-level drawing primitives.
 *              All layout components use this builder to draw.
 */

import { PDFDocument, PDFPage, PDFFont, rgb } from "pdf-lib";
import { PAGE_W, PAGE_H, MARGIN, CONTENT_W, COLORS } from "../constants";
import { LABELS } from "../labels";
import { sanitizeForPdf } from "../utils/sanitize";
import type { Lang } from "../types";

export class PdfBuilder {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  y: number;
  lang: Lang;
  companyName: string;

  constructor(
    pdfDoc: PDFDocument,
    font: PDFFont,
    fontBold: PDFFont,
    lang: Lang,
    companyName = "RIBOTFLOW"
  ) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.fontBold = fontBold;
    this.lang = lang;
    this.companyName = companyName;
    this.page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  /* ---------- Primitives ---------- */
  drawText(
    text: string,
    x: number,
    yPos: number,
    opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) {
    this.page.drawText(sanitizeForPdf(text), {
      x,
      y: yPos,
      font: opts.bold ? this.fontBold : this.font,
      size: opts.size ?? 10,
      color: opts.color ?? COLORS.text,
    });
  }

  measureWidth(text: string, size = 10, bold = false): number {
    const f = bold ? this.fontBold : this.font;
    return f.widthOfTextAtSize(sanitizeForPdf(text), size);
  }

  drawRect(x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
    this.page.drawRectangle({ x, y: y - h, width: w, height: h, color });
  }

  drawLine(yPos: number, color = COLORS.border, thickness = 0.5) {
    this.page.drawLine({
      start: { x: MARGIN, y: yPos },
      end: { x: PAGE_W - MARGIN, y: yPos },
      thickness,
      color,
    });
  }

  addSpace(n: number) {
    this.y -= n;
  }

  ensureSpace(needed: number) {
    if (this.y - needed < MARGIN + 40) {
      this.drawFooter();
      this.page = this.pdfDoc.addPage([PAGE_W, PAGE_H]);
      this.y = PAGE_H - MARGIN;
    }
  }

  /* ---------- Sections ---------- */
  drawSectionTitle(title: string) {
    this.ensureSpace(32);
    this.drawText(title, MARGIN, this.y, { bold: true, size: 11, color: COLORS.primaryDark });
    this.addSpace(6);
    this.drawLine(this.y, COLORS.primary, 1.5);
    this.addSpace(16);
  }

  drawKeyValueRow(label: string, value: string, yPos?: number) {
    const y = yPos ?? this.y;
    this.drawText(`${label}:`, MARGIN, y, { size: 9, color: COLORS.textMuted });
    this.drawText(value, MARGIN + 90, y, { size: 10 });
  }

  drawFooter() {
    const footerY = MARGIN + 10;
    this.drawLine(footerY + 14, COLORS.border, 0.5);
    const suffix = LABELS[this.lang].reportFooterSuffix;
    this.drawText(`${this.companyName} — ${suffix}`, MARGIN, footerY, {
      size: 8,
      color: COLORS.textMuted,
    });
  }

  /* ---------- Content blocks ---------- */
  drawInfoGrid(items: { label: string; value: string }[]) {
    this.ensureSpace(items.length * 14 + 10);
    for (const item of items) {
      this.drawKeyValueRow(item.label, item.value);
      this.addSpace(14);
    }
  }

  drawDescription(text: string) {
    const maxW = CONTENT_W;
    const safeText = sanitizeForPdf(text).replace(/\r?\n/g, " ");
    const words = safeText.split(" ");
    let line = "";

    for (const word of words) {
      const test = `${line}${word} `;
      if (this.measureWidth(test, 10) > maxW) {
        this.drawText(line.trim(), MARGIN, this.y, { size: 10 });
        this.addSpace(12);
        line = `${word} `;
      } else {
        line = test;
      }
    }
    if (line.trim()) {
      this.drawText(line.trim(), MARGIN, this.y, { size: 10 });
      this.addSpace(12);
    }
  }
}
