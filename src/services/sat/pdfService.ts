/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/pdfService.ts
 * Description: Professional PDF generation for work orders using pdf-lib.
 *              Multi-language support (ca/es/en), embedded photos,
 *              branded design with RIBOTFLOW colors.
 */

import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/db";
import { workOrders } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { buildPdfStorageKey } from "@/lib/utils/storageKeys";
import { workOrderService } from "./workOrderService";
import { materialService } from "./materialService";
import { attachmentService } from "./attachmentService";
import { signatureService } from "./signatureService";
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";

/* ================================================================
   CONSTANTS & DESIGN TOKENS
   ================================================================ */
const PAGE_W = 595.28; // A4 width (points)
const PAGE_H = 841.89; // A4 height (points)
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  primary: rgb(0.11, 0.63, 0.57), // teal-500
  primaryLight: rgb(0.85, 0.96, 0.94), // teal-50
  primaryDark: rgb(0.05, 0.42, 0.38), // teal-700
  text: rgb(0.11, 0.11, 0.11),
  textMuted: rgb(0.4, 0.4, 0.4),
  border: rgb(0.88, 0.88, 0.9),
  bgHeader: rgb(0.03, 0.27, 0.25),
  white: rgb(1, 1, 1),
};

/* ================================================================
   TRANSLATIONS
   ================================================================ */
type Lang = "ca" | "es" | "en";

const LABELS: Record<Lang, Record<string, string>> = {
  ca: {
    headerTitle: "RIBOTFLOW",
    headerSubtitle: "Informe d'Ordre de Treball",
    client: "CLIENT",
    workOrderDetails: "DETALLS DE L'ORDRE",
    description: "DESCRIPCIÓ",
    materials: "MATERIALS",
    attachments: "IMATGES ADJUNTES",
    signature: "SIGNATURA DIGITAL",
    total: "TOTAL",
    generated: "Generat",
    reportFooter: "RIBOTFLOW — Informe generat automàticament",
    name: "Nom",
    phone: "Telèfon",
    email: "Correu",
    address: "Adreça",
    status: "Estat",
    priority: "Prioritat",
    category: "Categoria",
    scheduled: "Programada",
    started: "Iniciada",
    completed: "Completada",
    qty: "Qt.",
    unitPrice: "Preu Unit.",
    lineTotal: "Import",
    before: "Abans",
    after: "Després",
    signedBy: "Signada per",
    none: "—",
  },
  es: {
    headerTitle: "RIBOTFLOW",
    headerSubtitle: "Informe de Orden de Trabajo",
    client: "CLIENTE",
    workOrderDetails: "DETALLES DE LA ORDEN",
    description: "DESCRIPCIÓN",
    materials: "MATERIALES",
    attachments: "IMÁGENES ADJUNTAS",
    signature: "FIRMA DIGITAL",
    total: "TOTAL",
    generated: "Generado",
    reportFooter: "RIBOTFLOW — Informe generado automáticamente",
    name: "Nombre",
    phone: "Teléfono",
    email: "Correo",
    address: "Dirección",
    status: "Estado",
    priority: "Prioridad",
    category: "Categoría",
    scheduled: "Programada",
    started: "Iniciada",
    completed: "Completada",
    qty: "Cant.",
    unitPrice: "Precio Unit.",
    lineTotal: "Importe",
    before: "Antes",
    after: "Después",
    signedBy: "Firmada por",
    none: "—",
  },
  en: {
    headerTitle: "RIBOTFLOW",
    headerSubtitle: "Work Order Report",
    client: "CLIENT",
    workOrderDetails: "WORK ORDER DETAILS",
    description: "DESCRIPTION",
    materials: "MATERIALS",
    attachments: "ATTACHED IMAGES",
    signature: "DIGITAL SIGNATURE",
    total: "TOTAL",
    generated: "Generated",
    reportFooter: "RIBOTFLOW — Automatically generated report",
    name: "Name",
    phone: "Phone",
    email: "Email",
    address: "Address",
    status: "Status",
    priority: "Priority",
    category: "Category",
    scheduled: "Scheduled",
    started: "Started",
    completed: "Completed",
    qty: "Qty",
    unitPrice: "Unit Price",
    lineTotal: "Line Total",
    before: "Before",
    after: "After",
    signedBy: "Signed by",
    none: "—",
  },
};

/* ================================================================
   HELPERS
   ================================================================ */
function fmtDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ca-ES");
}

function fmtCurrency(value: string | null): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} €`;
}

async function embedImage(pdfDoc: PDFDocument, imageUrl: string) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("png")) return pdfDoc.embedPng(buf);
  if (ct.includes("jpg") || ct.includes("jpeg")) return pdfDoc.embedJpg(buf);
  throw new Error(`Unsupported image type: ${ct}`);
}

/* ================================================================
   PDF BUILDER — handles layout, pages, drawing primitives
   ================================================================ */
class PdfBuilder {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  y: number;
  lang: Lang;

  constructor(pdfDoc: PDFDocument, font: PDFFont, fontBold: PDFFont, lang: Lang) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.fontBold = fontBold;
    this.lang = lang;
    this.page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  /* ---------- Low-level primitives ---------- */
  drawText(
    text: string,
    x: number,
    yPos: number,
    opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) {
    this.page.drawText(text, {
      x,
      y: yPos,
      font: opts.bold ? this.fontBold : this.font,
      size: opts.size ?? 10,
      color: opts.color ?? COLORS.text,
    });
  }

  measureWidth(text: string, size = 10, bold = false): number {
    const f = bold ? this.fontBold : this.font;
    return f.widthOfTextAtSize(text, size);
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

  /* ---------- Layout helpers ---------- */
  addSpace(n: number) {
    this.y -= n;
  }

  ensureSpace(needed: number) {
    if (this.y - needed < MARGIN + 40) {
      // Footer on current page
      this.drawFooter();
      // New page
      this.page = this.pdfDoc.addPage([PAGE_W, PAGE_H]);
      this.y = PAGE_H - MARGIN;
    }
  }

  /* ---------- Sections ---------- */
  drawHeader(workOrderNumber: string) {
    // Dark teal banner
    this.drawRect(0, this.y + 16, PAGE_W, 80, COLORS.bgHeader);

    // Logo text
    this.drawText(LABELS[this.lang].headerTitle, MARGIN, this.y - 10, {
      bold: true,
      size: 22,
      color: COLORS.white,
    });

    // Subtitle
    this.drawText(LABELS[this.lang].headerSubtitle, MARGIN, this.y - 34, {
      size: 11,
      color: rgb(0.6, 0.85, 0.82),
    });

    // Work order number on right
    const numText = workOrderNumber;
    const numW = this.measureWidth(numText, 14, true);
    this.drawText(numText, PAGE_W - MARGIN - numW, this.y - 10, {
      bold: true,
      size: 14,
      color: COLORS.white,
    });

    this.y -= 88;
  }

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
    this.drawText(LABELS[this.lang].reportFooter, MARGIN, footerY, {
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
    const words = text.split(" ");
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

  drawMaterialsTable(
    materials: { name: string; quantity: string; unitPrice: string | null }[]
  ) {
    if (materials.length === 0) return;

    const cols = [MARGIN, MARGIN + 230, MARGIN + 310, MARGIN + 390, MARGIN + 460];
    const rowH = 18;

    // Header row background
    this.ensureSpace(materials.length * rowH + 34);
    this.drawRect(MARGIN, this.y + 4, CONTENT_W, rowH, COLORS.primaryLight);

    // Headers
    this.drawText(LABELS[this.lang].name, cols[0] + 4, this.y, { bold: true, size: 9, color: COLORS.primaryDark });
    this.drawText(LABELS[this.lang].qty, cols[1] + 4, this.y, { bold: true, size: 9, color: COLORS.primaryDark });
    this.drawText(LABELS[this.lang].unitPrice, cols[2] + 4, this.y, { bold: true, size: 9, color: COLORS.primaryDark });
    this.drawText(LABELS[this.lang].lineTotal, cols[3] + 4, this.y, { bold: true, size: 9, color: COLORS.primaryDark });
    this.addSpace(rowH);

    let grandTotal = 0;
    for (const mat of materials) {
      // Alternate row background
      const idx = materials.indexOf(mat);
      if (idx % 2 !== 0) {
        this.drawRect(MARGIN, this.y + 4, CONTENT_W, rowH, rgb(0.97, 0.97, 0.98));
      }

      const qty = parseFloat(String(mat.quantity));
      const price = mat.unitPrice ? parseFloat(mat.unitPrice) : 0;
      const lineTotal = qty * price;
      grandTotal += lineTotal;

      this.drawText(mat.name, cols[0] + 4, this.y, { size: 9 });
      this.drawText(String(mat.quantity), cols[1] + 4, this.y, { size: 9 });
      this.drawText(fmtCurrency(mat.unitPrice), cols[2] + 4, this.y, { size: 9 });
      this.drawText(`${lineTotal.toFixed(2)} €`, cols[3] + 4, this.y, { size: 9 });

      this.addSpace(rowH);
    }

    // Total row
    this.drawLine(this.y + 4, COLORS.border, 0.5);
    this.addSpace(6);
    this.drawText(`${LABELS[this.lang].total}:`, cols[2] + 4, this.y, { bold: true, size: 10 });
    this.drawText(`${grandTotal.toFixed(2)} €`, cols[3] + 4, this.y, { bold: true, size: 10, color: COLORS.primaryDark });
    this.addSpace(14);
  }

  async drawPhotoGrid(
    photos: { url: string; fileName: string; isBefore: boolean; caption: string | null }[]
  ) {
    if (photos.length === 0) return;

    const imgWidth = (CONTENT_W - 12) / 2;

    for (let i = 0; i < photos.length; i += 2) {
      const row = photos.slice(i, i + 2);
      let maxH = 0;

      // Pre-embed to get dimensions
      const embeds = await Promise.all(
        row.map(async (p) => {
          try {
            const img = await embedImage(this.pdfDoc, p.url);
            const h = imgWidth * (img.height / img.width);
            return { img, h, photo: p };
          } catch {
            return null;
          }
        })
      );

      const valid = embeds.filter(Boolean) as { img: PDFImage; h: number; photo: typeof row[0] }[];
      if (valid.length === 0) continue;

      // Calculate max height of this row
      maxH = Math.max(...valid.map((v) => v.h));
      this.ensureSpace(maxH + 28);

      for (let j = 0; j < valid.length; j++) {
        const { img, h, photo } = valid[j];
        const x = MARGIN + j * (imgWidth + 12);
        const yImg = this.y - h;

        // Border box
        this.page.drawRectangle({
          x: x - 2,
          y: yImg - 2,
          width: imgWidth + 4,
          height: h + 4,
          borderColor: COLORS.border,
          borderWidth: 0.5,
          color: rgb(0.98, 0.98, 0.98),
        });

        this.page.drawImage(img, { x, y: yImg, width: imgWidth, height: h });

        // Label (Before / After)
        const label = photo.isBefore ? LABELS[this.lang].before : photo.caption ? photo.caption : photo.fileName;
        this.drawText(label, x, yImg - 14, { size: 8, color: COLORS.textMuted });
      }

      this.y -= maxH + 24;
    }
  }

  async drawSignature(pngUrl: string | null, signedBy: string | null) {
    if (pngUrl) {
      try {
        const img = await embedImage(this.pdfDoc, pngUrl);
        const imgW = 180;
        const imgH = imgW * (img.height / img.width);

        this.ensureSpace(imgH + 30);
        this.drawText(`${LABELS[this.lang].signedBy}: ${signedBy ?? ""}`, MARGIN, this.y, {
          size: 10,
          color: COLORS.textMuted,
        });
        this.addSpace(16);

        // Border box
        this.page.drawRectangle({
          x: MARGIN - 2,
          y: this.y - imgH - 2,
          width: imgW + 4,
          height: imgH + 4,
          borderColor: COLORS.border,
          borderWidth: 0.5,
          color: COLORS.white,
        });

        this.page.drawImage(img, { x: MARGIN, y: this.y - imgH, width: imgW, height: imgH });
        this.y -= imgH + 10;
      } catch {
        // Ignore signature embedding errors
      }
    } else if (signedBy) {
      this.ensureSpace(20);
      this.drawText(`${LABELS[this.lang].signedBy}: ${signedBy}`, MARGIN, this.y, { size: 10 });
      this.addSpace(16);
    }
  }
}

/* ================================================================
   PDF SERVICE
   ================================================================ */
export class PdfService {
  constructor(private readonly storage: FileStorage) {}

  async generateWorkOrderPdf(
    companyId: string,
    workOrderId: string,
    lang: Lang = "ca"
  ) {
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

    /* ---------- Build PDF ---------- */
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const builder = new PdfBuilder(pdfDoc, font, fontBold, lang);

    // Header
    builder.drawHeader(workOrder.number);

    // Meta
    builder.drawText(
      `${LABELS[lang].generated}: ${new Date().toLocaleDateString("ca-ES")}`,
      MARGIN,
      builder.y,
      { size: 9, color: COLORS.textMuted }
    );
    builder.addSpace(28);

    // Client section
    builder.drawSectionTitle(LABELS[lang].client);
    builder.drawInfoGrid([
      { label: LABELS[lang].name, value: client.name },
      ...(client.phone ? [{ label: LABELS[lang].phone, value: client.phone }] : []),
      ...(client.email ? [{ label: LABELS[lang].email, value: client.email }] : []),
      ...(client.address ? [{ label: LABELS[lang].address, value: client.address }] : []),
    ]);
    builder.addSpace(20);

    // Work order details
    builder.drawSectionTitle(LABELS[lang].workOrderDetails);
    builder.drawInfoGrid([
      { label: LABELS[lang].status, value: workOrder.status },
      { label: LABELS[lang].priority, value: workOrder.priority },
      { label: LABELS[lang].category, value: category.name },
      { label: LABELS[lang].scheduled, value: fmtDate(workOrder.scheduledDate) },
      ...(workOrder.startedAt
        ? [{ label: LABELS[lang].started, value: fmtDate(workOrder.startedAt) }]
        : []),
      ...(workOrder.completedAt
        ? [{ label: LABELS[lang].completed, value: fmtDate(workOrder.completedAt) }]
        : []),
    ]);
    builder.addSpace(20);

    // Description
    if (workOrder.description) {
      builder.drawSectionTitle(LABELS[lang].description);
      builder.drawDescription(workOrder.description);
      builder.addSpace(20);
    }

    // Materials
    if (materials.length > 0) {
      builder.drawSectionTitle(LABELS[lang].materials);
      builder.drawMaterialsTable(materials);
      builder.addSpace(20);
    }

    // Photos
    const photos = attachments
      .filter((a) => a.type === "photo" && a.url)
      .map((a) => ({
        url: a.url!,
        fileName: a.fileName,
        isBefore: a.isBefore,
        caption: a.caption,
      }));

    if (photos.length > 0) {
      builder.drawSectionTitle(LABELS[lang].attachments);
      await builder.drawPhotoGrid(photos);
      builder.addSpace(20);
    }

    // Signature
    if (signature) {
      builder.drawSectionTitle(LABELS[lang].signature);
      await builder.drawSignature(signature.signaturePngUrl, signature.signedBy);
    }

    // Footer on last page
    builder.drawFooter();

    /* ---------- Save ---------- */
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const storageKey = buildPdfStorageKey(companyId, workOrder.number, lang);
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

  async deletePdf(companyId: string, workOrderId: string) {
    const order = await workOrderService.getById(companyId, workOrderId);
    if (!order) {
      throw new Error("Work order not found or access denied");
    }

    // Delete from storage (try all language variants)
    const langs: Lang[] = ["ca", "es", "en"];
    for (const lang of langs) {
      const storageKey = buildPdfStorageKey(companyId, order.number, lang);
      try {
        await this.storage.delete(storageKey);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Clear pdfUrl in database
    await db
      .update(workOrders)
      .set({ pdfUrl: null })
      .where(eq(workOrders.id, workOrderId));

    return { success: true };
  }
}

export const pdfService = new PdfService(createFileStorage());
