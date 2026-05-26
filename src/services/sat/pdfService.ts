/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/pdfService.ts
 * Description: PDF generation for work orders using pdf-lib.
 *              Creates professional A4 PDFs with order data, materials,
 *              attachments count and signature image.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/db";
import { workOrders } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { workOrderService } from "./workOrderService";
import { materialService } from "./materialService";
import { attachmentService } from "./attachmentService";
import { signatureService } from "./signatureService";
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";

/* ================================================================
   CONSTANTS
   ================================================================ */
const PAGE_W = 595.28; // A4 width (points)
const PAGE_H = 841.89; // A4 height (points)
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

/* ================================================================
   HELPERS
   ================================================================ */
function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ca-ES");
}

function formatCurrency(value: string | null): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} €`;
}

/* ================================================================
   PDF SERVICE
   ================================================================ */
export class PdfService {
  constructor(private readonly storage: FileStorage) {}

  async generateWorkOrderPdf(companyId: string, workOrderId: string) {
    /* ---------- Fetch data ---------- */
    const orderData = await workOrderService.getByIdWithRelations(
      companyId,
      workOrderId
    );
    if (!orderData) {
      throw new Error("Work order not found or access denied");
    }

    const materials = await materialService.getByWorkOrder(companyId, workOrderId);
    const attachments = await attachmentService.getByWorkOrder(companyId, workOrderId);
    const signature = await signatureService.getByWorkOrder(companyId, workOrderId);

    const { workOrder, client, category } = orderData;

    /* ---------- Create PDF document ---------- */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = PAGE_H - MARGIN;

    const drawText = (
      text: string,
      x: number,
      yPos: number,
      opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number } }
    ) => {
      page.drawText(text, {
        x,
        y: yPos,
        font: opts?.bold ? fontBold : font,
        size: opts?.size ?? 10,
        color: opts?.color ? rgb(opts.color.r, opts.color.g, opts.color.b) : rgb(0.2, 0.2, 0.2),
      });
    };

    const drawLine = (yPos: number) => {
      page.drawLine({
        start: { x: MARGIN, y: yPos },
        end: { x: PAGE_W - MARGIN, y: yPos },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75),
      });
    };

    /* ---------- Header ---------- */
    drawText("RIBOTFLOW", MARGIN, y, { bold: true, size: 20, color: { r: 0.1, g: 0.1, b: 0.1 } });
    y -= 22;
    drawText(`${workOrder.number}`, MARGIN, y, { bold: true, size: 14, color: { r: 0.15, g: 0.15, b: 0.15 } });
    y -= 14;
    drawText(`Generated: ${formatDate(new Date())}`, MARGIN, y, { size: 9, color: { r: 0.45, g: 0.45, b: 0.45 } });
    y -= 28;
    drawLine(y + 8);
    y -= 16;

    /* ---------- Client ---------- */
    drawText("CLIENT", MARGIN, y, { bold: true, size: 11, color: { r: 0.1, g: 0.1, b: 0.1 } });
    y -= 14;
    drawText(`Name: ${client.name}`, MARGIN, y);
    y -= 12;
    if (client.phone) {
      drawText(`Phone: ${client.phone}`, MARGIN, y);
      y -= 12;
    }
    if (client.email) {
      drawText(`Email: ${client.email}`, MARGIN, y);
      y -= 12;
    }
    if (client.address) {
      drawText(`Address: ${client.address}`, MARGIN, y);
      y -= 12;
    }
    y -= 8;

    /* ---------- Work order details ---------- */
    drawText("WORK ORDER DETAILS", MARGIN, y, { bold: true, size: 11, color: { r: 0.1, g: 0.1, b: 0.1 } });
    y -= 14;
    drawText(`Status: ${workOrder.status}`, MARGIN, y);
    y -= 12;
    drawText(`Priority: ${workOrder.priority}`, MARGIN, y);
    y -= 12;
    drawText(`Category: ${category.name}`, MARGIN, y);
    y -= 12;
    drawText(`Scheduled: ${formatDate(workOrder.scheduledDate)}`, MARGIN, y);
    y -= 12;
    if (workOrder.startedAt) {
      drawText(`Started: ${formatDate(workOrder.startedAt)}`, MARGIN, y);
      y -= 12;
    }
    if (workOrder.completedAt) {
      drawText(`Completed: ${formatDate(workOrder.completedAt)}`, MARGIN, y);
      y -= 12;
    }
    y -= 8;

    /* ---------- Description ---------- */
    if (workOrder.description) {
      drawText("DESCRIPTION", MARGIN, y, { bold: true, size: 11, color: { r: 0.1, g: 0.1, b: 0.1 } });
      y -= 14;

      const words = workOrder.description.split(" ");
      let line = "";
      for (const word of words) {
        const test = `${line}${word} `;
        if (font.widthOfTextAtSize(test, 10) > CONTENT_W) {
          drawText(line.trim(), MARGIN, y);
          y -= 12;
          line = `${word} `;
        } else {
          line = test;
        }
      }
      if (line.trim()) {
        drawText(line.trim(), MARGIN, y);
        y -= 12;
      }
      y -= 8;
    }

    /* ---------- Materials table ---------- */
    if (materials.length > 0) {
      drawText("MATERIALS", MARGIN, y, { bold: true, size: 11, color: { r: 0.1, g: 0.1, b: 0.1 } });
      y -= 14;

      const cols = [MARGIN, MARGIN + 240, MARGIN + 320, MARGIN + 400];
      drawText("Name", cols[0], y, { bold: true, size: 9 });
      drawText("Qty", cols[1], y, { bold: true, size: 9 });
      drawText("Unit Price", cols[2], y, { bold: true, size: 9 });
      drawText("Total", cols[3], y, { bold: true, size: 9 });
      y -= 4;
      drawLine(y);
      y -= 12;

      let grandTotal = 0;
      for (const mat of materials) {
        drawText(mat.name, cols[0], y, { size: 9 });
        drawText(String(mat.quantity), cols[1], y, { size: 9 });
        drawText(formatCurrency(mat.unitPrice), cols[2], y, { size: 9 });

        const qty = parseFloat(String(mat.quantity));
        const price = mat.unitPrice ? parseFloat(mat.unitPrice) : 0;
        const lineTotal = qty * price;
        grandTotal += lineTotal;
        drawText(`${lineTotal.toFixed(2)} €`, cols[3], y, { size: 9 });
        y -= 12;
      }

      y -= 4;
      drawLine(y);
      y -= 12;
      drawText(`Total: ${grandTotal.toFixed(2)} €`, MARGIN, y, { bold: true, size: 10 });
      y -= 16;
    }

    /* ---------- Attachments ---------- */
    if (attachments.length > 0) {
      drawText(`ATTACHMENTS: ${attachments.length} file(s)`, MARGIN, y, {
        size: 10,
        color: { r: 0.4, g: 0.4, b: 0.4 },
      });
      y -= 14;
    }

    /* ---------- Signature ---------- */
    if (signature?.signaturePngUrl) {
      try {
        const response = await fetch(signature.signaturePngUrl);
        if (response.ok) {
          const pngBuffer = Buffer.from(await response.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(pngBuffer);

          y -= 10;
          drawText("SIGNATURE", MARGIN, y, { bold: true, size: 11 });
          y -= 5;

          const imgW = 160;
          const imgH = (pngImage.height / pngImage.width) * imgW;
          page.drawImage(pngImage, {
            x: MARGIN,
            y: y - imgH,
            width: imgW,
            height: imgH,
          });
          y -= imgH + 10;
        }
      } catch {
        // Ignore signature embedding errors
      }
    } else if (signature?.signedBy) {
      y -= 10;
      drawText("SIGNATURE", MARGIN, y, { bold: true, size: 11 });
      y -= 14;
      drawText(`Signed by: ${signature.signedBy}`, MARGIN, y);
      y -= 12;
    }

    /* ---------- Footer ---------- */
    drawLine(MARGIN + 20);
    drawText("RIBOTFLOW - Work Order Report", MARGIN, MARGIN + 5, {
      size: 8,
      color: { r: 0.5, g: 0.5, b: 0.5 },
    });

    /* ---------- Save ---------- */
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const storageKey = `pdfs/${companyId}/${workOrderId}.pdf`;
    const uploadResult = await this.storage.upload({
      buffer,
      storageKey,
      mimeType: "application/pdf",
    });

    await db
      .update(workOrders)
      .set({ pdfUrl: uploadResult.publicUrl })
      .where(eq(workOrders.id, workOrderId));

    return { url: uploadResult.publicUrl };
  }
}

export const pdfService = new PdfService(createFileStorage());
