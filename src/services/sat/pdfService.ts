/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/sat/pdfService.ts
 * Description: Professional PDF generation for work orders using pdf-lib.
 *              Multi-language support (ca/es/en), embedded photos,
 *              branded design with RIBOTFLOW colors.
 */

import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/db";
import { workOrders, quotes, clients } from "@/db/schema/sat";
import { companies } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  buildStorageContext,
  buildQuotePdfKey,
  buildSignedQuoteKey,
  buildWorkOrderReportKey,
  buildWorkOrderSignatureKey,
  buildQuoteSignatureKey,
  type StorageContext,
} from "@/lib/utils/storageKeys";
import { workOrderService } from "./workOrderService";
import { materialService } from "./materialService";
import { attachmentService } from "./attachmentService";
import { signatureService } from "./signatureService";
import { quoteService } from "./quoteService";
import { quoteItemService } from "./quoteItemService";
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
  // Quote-specific palette (matches QuotePdfPreview.tsx)
  slate900: rgb(0.118, 0.161, 0.231), // #1e293b (dark text, table header)
  slate700: rgb(0.2, 0.255, 0.333),    // #334155 (body text)
  slate600: rgb(0.278, 0.333, 0.412),  // #475569 (muted body)
  slate500: rgb(0.392, 0.455, 0.545),  // #64748b (caption text)
  slate400: rgb(0.58, 0.639, 0.722),   // #94a3b8 (very muted)
  slate200: rgb(0.886, 0.910, 0.941),  // #e2e8f0 (border)
  slate100: rgb(0.941, 0.953, 0.969),  // #f1f5f9 (light bg)
  slate50: rgb(0.973, 0.980, 0.988),   // #f8fafc (very light bg)
  blue500: rgb(0.231, 0.510, 0.965),   // #3b82f6 (accent border)
  green600: rgb(0.086, 0.392, 0.290),  // #16a34a (discount)
};

/* ================================================================
   TRANSLATIONS
   ================================================================ */
type Lang = "ca" | "es" | "en";

const LABELS: Record<Lang, Record<string, string>> = {
  ca: {
    headerTitle: "RIBOTFLOW",
    headerSubtitle: "Informe d'Ordre de Treball",
    quoteSubtitle: "Pressupost",
    client: "CLIENT",
    workOrderDetails: "DETALLS DE L'ORDRE",
    quoteDetails: "DETALLS DEL PRESSUPOST",
    description: "DESCRIPCIÓ",
    materials: "MATERIALS",
    attachments: "IMATGES ADJUNTES",
    signature: "SIGNATURA DIGITAL",
    itemDescription: "Descripció",
    itemQty: "Qtat",
    itemUnit: "Unitat",
    itemUnitPrice: "Preu Unit.",
    itemTotal: "Total",
    subtotal: "Base Imposable",
    discount: "Descompte",
    tax: "IVA",
    validUntil: "Vàlid fins",
    conditions: "Condicions",
    notes: "Notes",
    company: "EMPRESA",
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
    // Quote document labels (match QuotePdfPreview)
    quoteDocTitle: "Pressupost",
    quoteNum: "NUM.",
    from: "De:",
    to: "Per a:",
    issueDate: "Data emissio:",
    validity: "Validesa:",
    term: "Termini:",
    days: "dies",
    workDescription: "Descripcio del treball",
    ref: "Ref.",
    itemConcept: "Descripcio del Concepte",
    itemUnits: "Unitats",
    itemUnitPriceCol: "Preu Unitari",
    itemTotalCol: "Total",
    conditionsTitle: "Condicions generals i forma de pagament",
    signatureTitle: "Acceptacio del Pressupost",
    signatureCaption: "Per aprovar i formalitzar la comanda, si us plau, signeu i retorneu aquest document.",
    signatureLine: "Signatura del client i data",
    signatureThanks: "Gracies per la seva confiança.",
    signedOn: "Signat el",
    acceptedBy: "Acceptat per",
    acceptanceConfirmed: "Acceptacio confirmada",
  },
  es: {
    headerTitle: "RIBOTFLOW",
    headerSubtitle: "Informe de Orden de Trabajo",
    quoteSubtitle: "Presupuesto",
    client: "CLIENTE",
    workOrderDetails: "DETALLES DE LA ORDEN",
    quoteDetails: "DETALLES DEL PRESUPUESTO",
    description: "DESCRIPCIÓN",
    materials: "MATERIALES",
    attachments: "IMÁGENES ADJUNTAS",
    signature: "FIRMA DIGITAL",
    itemDescription: "Descripción",
    itemQty: "Cant.",
    itemUnit: "Unidad",
    itemUnitPrice: "Precio Unit.",
    itemTotal: "Total",
    subtotal: "Base Imponible",
    discount: "Descuento",
    tax: "IVA",
    validUntil: "Válido hasta",
    conditions: "Condiciones",
    notes: "Notas",
    company: "EMPRESA",
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
    quoteDocTitle: "Presupuesto",
    quoteNum: "NUM.",
    from: "De:",
    to: "Para:",
    issueDate: "Fecha emision:",
    validity: "Validez:",
    term: "Plazo:",
    days: "dias",
    workDescription: "Descripcion del trabajo",
    ref: "Ref.",
    itemConcept: "Descripcion del Concepto",
    itemUnits: "Unidades",
    itemUnitPriceCol: "Precio Unitario",
    itemTotalCol: "Total",
    conditionsTitle: "Condiciones generales y forma de pago",
    signatureTitle: "Aceptacion del Presupuesto",
    signatureCaption: "Para aprobar y formalizar el pedido, por favor firme y devuelva este documento.",
    signatureLine: "Firma del cliente y fecha",
    signatureThanks: "Gracias por su confianza.",
    signedOn: "Firmado el",
    acceptedBy: "Aceptado por",
    acceptanceConfirmed: "Aceptacion confirmada",
  },
  en: {
    headerTitle: "RIBOTFLOW",
    headerSubtitle: "Work Order Report",
    quoteSubtitle: "Quote",
    client: "CLIENT",
    workOrderDetails: "WORK ORDER DETAILS",
    quoteDetails: "QUOTE DETAILS",
    description: "DESCRIPTION",
    materials: "MATERIALS",
    attachments: "ATTACHED IMAGES",
    signature: "DIGITAL SIGNATURE",
    itemDescription: "Description",
    itemQty: "Qty",
    itemUnit: "Unit",
    itemUnitPrice: "Unit Price",
    itemTotal: "Total",
    subtotal: "Taxable Base",
    discount: "Discount",
    tax: "Tax",
    validUntil: "Valid until",
    conditions: "Conditions",
    notes: "Notes",
    company: "COMPANY",
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
    quoteDocTitle: "Quote",
    quoteNum: "NO.",
    from: "From:",
    to: "To:",
    issueDate: "Issue date:",
    validity: "Validity:",
    term: "Term:",
    days: "days",
    workDescription: "Work description",
    ref: "Ref.",
    itemConcept: "Item Description",
    itemUnits: "Units",
    itemUnitPriceCol: "Unit Price",
    itemTotalCol: "Total",
    conditionsTitle: "General conditions and payment terms",
    signatureTitle: "Quote Acceptance",
    signatureCaption: "To approve and formalize the order, please sign and return this document.",
    signatureLine: "Client signature and date",
    signatureThanks: "Thank you for your trust.",
    signedOn: "Signed on",
    acceptedBy: "Accepted by",
    acceptanceConfirmed: "Acceptance confirmed",
  },
};

/* ================================================================
   HELPERS
   ================================================================ */

/**
 * Sanitize text for use with StandardFonts (Helvetica, Times, Courier).
 * pdf-lib's WinAnsi encoding cannot represent Unicode chars like €, à, é, ñ.
 * Strategy: strip accents, replace € with EUR, drop other non-ASCII.
 */
function sanitizeForPdf(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents (à → a, é → e, ñ → n, ç → c)
    .replace(/€/g, "EUR") // euro symbol → "EUR"
    .replace(/—/g, "-") // em dash → hyphen (also not in WinAnsi)
    .replace(/–/g, "-") // en dash → hyphen
    .replace(/[‘’]/g, "'") // smart single quotes
    .replace(/[“”]/g, '"') // smart double quotes
    .replace(/·/g, "*") // middle dot
    .replace(/…/g, "...") // ellipsis
    .replace(/[^\u0020-\u007E]/g, ""); // strip any remaining non-ASCII (keep printable only)
}

function fmtDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ca-ES");
}

function fmtCurrency(value: string | null): string {
  if (!value) return "-";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)} EUR`;
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
    const clean = sanitizeForPdf(text);
    this.page.drawText(clean, {
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
      const maxH = Math.max(...valid.map((v) => v.h));
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

        // Label (Before / caption only — no fileName)
        const label = photo.isBefore ? LABELS[this.lang].before : (photo.caption ?? "");
        if (label) {
          this.drawText(label, x, yImg - 14, { size: 8, color: COLORS.textMuted });
        }
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

  /* ============================================================
     QUOTE DOCUMENT LAYOUT
     Mirrors the visual design of QuotePdfPreview.tsx
     ============================================================ */

  /**
   * Header: company name (large) + NIF | "Pressupost" + number.
   * Mimics the dual-column top banner of the preview.
   */
  drawCompanyHeader(quoteNumber: string, companyName: string, companyTaxId: string | null) {
    this.ensureSpace(80);
    const startY = this.y;

    // Left column: company name + tax id
    this.drawText(companyName, MARGIN, startY - 8, {
      bold: true,
      size: 18,
      color: COLORS.slate900,
    });
    if (companyTaxId) {
      this.drawText(`NIF: ${companyTaxId}`, MARGIN, startY - 28, {
        size: 9,
        color: COLORS.slate500,
      });
    }

    // Right column: PRESSUPOST title + number
    const t = LABELS[this.lang];
    const titleText = t.quoteDocTitle;
    const numText = `${t.quoteNum} ${quoteNumber}`;
    const titleW = this.measureWidth(titleText, 22, true);
    const numW = this.measureWidth(numText, 11, true);
    this.drawText(titleText, PAGE_W - MARGIN - titleW, startY - 6, {
      bold: true,
      size: 22,
      color: COLORS.slate900,
    });
    this.drawText(numText, PAGE_W - MARGIN - numW, startY - 30, {
      bold: true,
      size: 11,
      color: COLORS.slate600,
    });

    // Bottom border
    this.y = startY - 46;
    this.drawLine(this.y, COLORS.slate200, 1);
    this.y -= 22;
  }

  /**
   * 3-column info section: From | To (highlighted card) | Dates.
   * All 3 columns start at the same Y (top-aligned) and have the same
   * height (determined by the tallest column). The client card gets a
   * slate-50 background with a blue left border; the dates box gets a
   * slate-100 background.
   */
  drawInfoSection(
    company: { name: string; address: string | null; phone: string | null; email: string | null },
    client: { name: string; taxId: string | null; address: string | null; email: string | null; phone: string | null },
    validUntil: string | null
  ) {
    this.ensureSpace(140);
    const t = LABELS[this.lang];
    const topY = this.y;

    // Column geometry
    const col1W = CONTENT_W * 0.30;
    const col2W = CONTENT_W * 0.35;
    const col3W = CONTENT_W * 0.31;
    const col1X = MARGIN;
    const col2X = MARGIN + col1W + 8;
    const col3X = MARGIN + col1W + col2W + 16;

    const lineH = 13;
    const pad = 10;
    const labelH = 16;

    // Prepare content for each column
    const c1Lines = [
      company.name,
      ...(company.phone ? [`Tel: ${company.phone}`] : []),
      ...(company.email ? [company.email] : []),
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

    // All columns share the same height = tallest column
    const maxLines = Math.max(c1Lines.length, c2Lines.length, c3Lines.length);
    const sectionH = labelH + maxLines * lineH + pad * 2;

    // Draw backgrounds FIRST (behind text)
    // Column 2: client card (slate-50 bg + blue left border)
    this.page.drawRectangle({
      x: col2X,
      y: topY - sectionH,
      width: col2W,
      height: sectionH,
      color: COLORS.slate50,
      borderColor: COLORS.slate200,
      borderWidth: 0.5,
    });
    this.page.drawRectangle({
      x: col2X,
      y: topY - sectionH,
      width: 3,
      height: sectionH,
      color: COLORS.blue500,
    });

    // Column 3: dates box (slate-100 bg)
    this.page.drawRectangle({
      x: col3X,
      y: topY - sectionH,
      width: col3W,
      height: sectionH,
      color: COLORS.slate100,
      borderColor: COLORS.slate200,
      borderWidth: 0.5,
    });

    // Column labels (same top line)
    this.drawText(t.from, col1X, topY - 4, { bold: true, size: 8.5, color: COLORS.slate500 });
    this.drawText(t.to, col2X + pad, topY - 4, { bold: true, size: 8.5, color: COLORS.slate500 });

    // Column 1 content (top-aligned)
    let y1 = topY - labelH - 4;
    for (const line of c1Lines) {
      const isBold = line === company.name;
      this.drawText(line, col1X, y1, {
        bold: isBold, size: 9, color: isBold ? COLORS.slate900 : COLORS.slate600,
      });
      y1 -= lineH;
    }

    // Column 2 content (inside card, with padding, top-aligned)
    let y2 = topY - labelH - 4;
    for (const line of c2Lines) {
      const isBold = line === client.name;
      this.drawText(line, col2X + pad, y2, {
        bold: isBold, size: 9, color: isBold ? COLORS.slate900 : COLORS.slate600,
      });
      y2 -= lineH;
    }

    // Column 3 content (inside dates box, with padding, top-aligned)
    let y3 = topY - labelH - 4;
    for (const line of c3Lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const labelPart = line.slice(0, colonIdx + 1);
        const valuePart = line.slice(colonIdx + 1).trim();
        this.drawText(labelPart, col3X + pad, y3, {
          bold: true, size: 8.5, color: COLORS.slate600,
        });
        const valueW = this.measureWidth(valuePart, 9, false);
        this.drawText(valuePart, col3X + col3W - valueW - pad, y3, {
          size: 9, color: COLORS.slate700,
        });
      } else {
        this.drawText(line, col3X + pad, y3, { size: 9, color: COLORS.slate700 });
      }
      y3 -= lineH;
    }

    this.y = topY - sectionH - 24;
  }

  /**
   * Description block with gray background card and border.
   */
  drawDescriptionBlock(description: string) {
    this.ensureSpace(100);
    const t = LABELS[this.lang];
    const topY = this.y;
    const title = t.workDescription;
    const titleH = 20;

    // Estimate wrapped text height
    const words = sanitizeForPdf(description).replace(/\r?\n/g, " ").split(" ");
    const maxW = CONTENT_W - 24;
    let line = "";
    let lines = 0;
    for (const word of words) {
      const test = `${line}${word} `;
      if (this.measureWidth(test, 10) > maxW) {
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

    // Background box with border
    this.page.drawRectangle({
      x: MARGIN,
      y: topY - boxH,
      width: CONTENT_W,
      height: boxH,
      color: COLORS.slate50,
      borderColor: COLORS.slate200,
      borderWidth: 0.5,
    });

    // Title
    this.drawText(title, MARGIN + pad, topY - 16, {
      bold: true, size: 8.5, color: COLORS.slate500,
    });

    // Text
    this.y = topY - titleH - 4;
    this.drawDescription(description);

    this.y = topY - boxH - 24;
  }

  /**
   * Items table with slate-900 header (matches preview).
   * Columns sum to 100% of CONTENT_W. Each cell is properly aligned
   * (left/center/right) within its column.
   */
  drawItemsTable(items: { description: string; quantity: string; unit: string; unitPrice: string; total: string }[]) {
    if (items.length === 0) return;
    this.ensureSpace(items.length * 22 + 50);

    const t = LABELS[this.lang];
    // Column definition: width fraction (sum = 1.0) + horizontal alignment.
    // Matches QuotePdfPreview.tsx proportions: 8 / 50 / 10 / 14 / 18 = 100.
    type ColDef = { width: number; align: "left" | "center" | "right"; label: string };
    const cols: ColDef[] = [
      { width: 0.08, align: "center", label: t.ref },
      { width: 0.50, align: "left",   label: t.itemConcept },
      { width: 0.10, align: "center", label: t.itemUnits },
      { width: 0.14, align: "right",  label: t.itemUnitPriceCol },
      { width: 0.18, align: "right",  label: t.itemTotalCol },
    ];

    // Pre-compute absolute X positions: colXStart[i] = left edge of col i.
    const colXStart: number[] = [MARGIN];
    for (const c of cols) {
      colXStart.push(colXStart[colXStart.length - 1] + c.width * CONTENT_W);
    }

    const headerH = 28;
    const rowH = 22;
    const padX = 8; // horizontal cell padding

    // Helper: compute text X inside column i with given width and alignment.
    const cellX = (i: number, textW: number): number => {
      const left = colXStart[i];
      const width = cols[i].width * CONTENT_W;
      if (cols[i].align === "left") return left + padX;
      if (cols[i].align === "right") return left + width - textW - padX;
      return left + (width - textW) / 2; // center
    };

    /* ---------- Header row ---------- */
    const headerTop = this.y;
    this.drawRect(MARGIN, headerTop - headerH + 6, CONTENT_W, headerH, COLORS.slate900);

    for (let i = 0; i < cols.length; i++) {
      const textW = this.measureWidth(cols[i].label, 8.5, true);
      this.drawText(
        cols[i].label,
        cellX(i, textW),
        headerTop - 18,
        { bold: true, size: 8.5, color: COLORS.white }
      );
    }
    this.y = headerTop - headerH;

    /* ---------- Body rows ---------- */
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const rowTop = this.y;

      // Alternating background
      if (idx % 2 === 1) {
        this.drawRect(MARGIN, rowTop - rowH + 4, CONTENT_W, rowH, COLORS.slate50);
      }
      // Bottom border
      this.drawLine(rowTop - rowH + 4, COLORS.slate200, 0.5);

      // Cell 0: Reference number (001, 002, ...)
      const refText = String(idx + 1).padStart(3, "0");
      const refW = this.measureWidth(refText, 9, false);
      this.drawText(refText, cellX(0, refW), rowTop - 16, {
        size: 9, color: COLORS.slate500,
      });

      // Cell 1: Description (truncate if too long, keep single line)
      const descText = this.truncateToWidth(item.description, cols[1].width * CONTENT_W - padX * 2, 9);
      this.drawText(descText, cellX(1, this.measureWidth(descText, 9, false)), rowTop - 16, {
        size: 9, color: COLORS.slate700,
      });

      // Cell 2: Units (e.g. "2 h")
      const unitsText = `${item.quantity} ${item.unit}`;
      const unitsW = this.measureWidth(unitsText, 9, false);
      this.drawText(unitsText, cellX(2, unitsW), rowTop - 16, {
        size: 9, color: COLORS.slate700,
      });

      // Cell 3: Unit price
      const priceText = `${parseFloat(item.unitPrice).toFixed(2)} EUR`;
      const priceW = this.measureWidth(priceText, 9, false);
      this.drawText(priceText, cellX(3, priceW), rowTop - 16, {
        size: 9, color: COLORS.slate700,
      });

      // Cell 4: Total
      const totalText = `${parseFloat(item.total).toFixed(2)} EUR`;
      const totalW = this.measureWidth(totalText, 9, true);
      this.drawText(totalText, cellX(4, totalW), rowTop - 16, {
        bold: true, size: 9, color: COLORS.slate900,
      });

      this.y -= rowH;
    }
    this.y -= 20;
  }

  /**
   * Truncate text to fit within a given pixel width, appending "..." if needed.
   */
  private truncateToWidth(text: string, maxWidth: number, size: number): string {
    if (this.measureWidth(text, size, false) <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 0 && this.measureWidth(truncated + "...", size, false) > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  }

  /**
   * Totals box (right-aligned, slate-900 grand total).
   */
  drawTotalsBox(
    subtotal: number,
    discountPercent: number,
    discountAmount: number,
    taxRate: number,
    taxAmount: number,
    total: number
  ) {
    this.ensureSpace(120);
    const t = LABELS[this.lang];
    const boxW = CONTENT_W * 0.42;
    const boxX = PAGE_W - MARGIN - boxW;
    const rowH = 18;
    const startY = this.y;

    const rows: { label: string; value: string; bold?: boolean; color?: ReturnType<typeof rgb>; size?: number }[] = [
      { label: `${t.subtotal}:`, value: `${subtotal.toFixed(2)} EUR` },
    ];
    if (discountPercent > 0) {
      rows.push({
        label: `${t.discount} (${discountPercent}%):`,
        value: `-${discountAmount.toFixed(2)} EUR`,
        color: COLORS.green600,
      });
    }
    rows.push({
      label: `${t.tax} (${taxRate}%):`,
      value: `${taxAmount.toFixed(2)} EUR`,
    });

    let rowY = startY;
    for (const r of rows) {
      this.drawText(r.label, boxX, rowY, {
        size: r.size ?? 9, color: r.color ?? COLORS.slate600,
      });
      const vW = this.measureWidth(r.value, r.size ?? 9, r.bold ?? false);
      this.drawText(r.value, boxX + boxW - vW, rowY, {
        bold: r.bold, size: r.size ?? 9, color: r.color ?? COLORS.slate700,
      });
      rowY -= rowH;
    }

    // Total separator
    this.drawLine(rowY + 4, COLORS.slate900, 1.5);
    rowY -= 6;

    // Grand total
    const totalLabel = `${t.total}:`;
    this.drawText(totalLabel, boxX, rowY, {
      bold: true, size: 12, color: COLORS.slate900,
    });
    const totalText = `${total.toFixed(2)} EUR`;
    const tW = this.measureWidth(totalText, 12, true);
    this.drawText(totalText, boxX + boxW - tW, rowY, {
      bold: true, size: 12, color: COLORS.slate900,
    });

    this.y = rowY - 28;
  }

  /**
   * Conditions / notes box with gray background and border.
   */
  drawConditionsBox(notes: string) {
    this.ensureSpace(100);
    const t = LABELS[this.lang];
    const topY = this.y;
    const title = t.conditionsTitle;
    const titleH = 22;

    // Estimate wrapped text height
    const words = sanitizeForPdf(notes).replace(/\r?\n/g, " ").split(" ");
    const maxW = CONTENT_W - 24;
    let line = "";
    let lines = 0;
    for (const word of words) {
      const test = `${line}${word} `;
      if (this.measureWidth(test, 10) > maxW) {
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

    // Background box with border
    this.page.drawRectangle({
      x: MARGIN,
      y: topY - boxH,
      width: CONTENT_W,
      height: boxH,
      color: COLORS.slate50,
      borderColor: COLORS.slate200,
      borderWidth: 0.5,
    });

    // Title with bottom separator line
    this.drawText(title, MARGIN + pad, topY - 16, {
      bold: true, size: 9, color: COLORS.slate900,
    });
    this.drawLine(topY - titleH + 4, COLORS.slate200, 0.5);

    // Text
    this.y = topY - titleH - 4;
    this.drawDescription(notes);

    this.y = topY - boxH - 24;
  }

  /**
   * Signature block. Renders empty signature line if no signature,
   * or embedded PNG signature + acceptance details if signed.
   */
  async drawSignatureBlock(opts: {
    signaturePngUrl?: string | null;
    signedBy?: string | null;
    signedAt?: Date | null;
  }) {
    this.ensureSpace(140);
    const t = LABELS[this.lang];
    const topY = this.y;
    const halfW = CONTENT_W / 2 - 10;

    // Left side: title + caption + signature area
    let leftY = topY;
    this.drawText(t.signatureTitle, MARGIN, leftY, {
      bold: true, size: 10, color: COLORS.slate900,
    });
    leftY -= 14;
    this.drawText(t.signatureCaption, MARGIN, leftY, {
      size: 8, color: COLORS.slate500,
    });
    leftY -= 16;

    if (opts.signaturePngUrl) {
      // Signed: embed PNG
      try {
        const img = await embedImage(this.pdfDoc, opts.signaturePngUrl);
        const imgW = 200;
        const imgH = imgW * (img.height / img.width);
        this.page.drawRectangle({
          x: MARGIN - 2,
          y: leftY - imgH - 2,
          width: imgW + 4,
          height: imgH + 4,
          borderColor: COLORS.slate400,
          borderWidth: 0.5,
          color: COLORS.white,
        });
        this.page.drawImage(img, { x: MARGIN, y: leftY - imgH, width: imgW, height: imgH });
        leftY -= imgH + 6;
        if (opts.signedBy) {
          this.drawText(`${t.signedBy}: ${opts.signedBy}`, MARGIN, leftY, {
            size: 8, color: COLORS.slate600,
          });
          leftY -= 11;
        }
        if (opts.signedAt) {
          this.drawText(
            `${t.signedOn}: ${opts.signedAt.toLocaleDateString("ca-ES")}`,
            MARGIN, leftY,
            { size: 8, color: COLORS.slate600 }
          );
          leftY -= 11;
        }
      } catch {
        // Fall back to empty line
        leftY -= 30;
        this.drawLine(leftY, COLORS.slate400, 0.5);
        leftY -= 8;
      }
    } else {
      // Empty: draw line for handwritten signature
      leftY -= 30;
      this.drawLine(leftY, COLORS.slate400, 0.5);
      leftY -= 8;
      this.drawText(t.signatureLine, MARGIN, leftY, {
        size: 8, color: COLORS.slate500,
      });
      leftY -= 16;
    }

    // Right side: thanks (aligned to topY)
    this.drawText(t.signatureThanks, MARGIN + halfW + 20, topY - 4, {
      size: 8, color: COLORS.slate400,
    });

    this.y = Math.min(leftY, topY - 60) - 20;
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

    const [company] = await db
      .select({ tenantSlug: companies.tenantSlug })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const materials = await materialService.getByWorkOrder(companyId, workOrderId);
    const attachments = await attachmentService.getByWorkOrder(companyId, workOrderId);
    const signature = await signatureService.getByEntity(companyId, "work_order", workOrderId);

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

    const ctx: StorageContext = {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self-hosted" ? "self-hosted" : "cloud",
      companyId,
      tenantSlug: company?.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };

    const storageKey = buildWorkOrderReportKey(ctx, workOrder.number, lang);
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

  /**
   * Build a quote PDF document. Mirrors the visual structure of
   * QuotePdfPreview.tsx so that the emailed PDF looks identical to the
   * on-screen preview.
   *
   * @param signaturePngUrl - if provided, the signature is embedded in the
   *   "Acceptacio del Pressupost" block. If null, the block shows an
   *   empty signature line.
   */
  private async buildQuoteDocument(opts: {
    companyId: string;
    quoteId: string;
    lang?: Lang;
    signaturePngUrl?: string | null;
    signedBy?: string | null;
    signedAt?: Date | null;
  }): Promise<{
    pdfDoc: PDFDocument;
    quote: NonNullable<Awaited<ReturnType<typeof quoteService.getById>>>;
    company: typeof companies.$inferSelect;
    client: typeof clients.$inferSelect;
  }> {
    const lang = opts.lang ?? "ca";

    const quote = await quoteService.getById(opts.companyId, opts.quoteId);
    if (!quote) throw new Error("Quote not found or access denied");

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, opts.companyId))
      .limit(1);
    if (!company) throw new Error("Company not found");

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, quote.clientId))
      .limit(1);
    if (!client) throw new Error("Client not found for this quote");

    /* ---------- Build PDF ---------- */
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const builder = new PdfBuilder(pdfDoc, font, fontBold, lang);

    // Header
    builder.drawCompanyHeader(quote.number, company.name, company.taxId ?? null);

    // Info section (De | Per a | Dates)
    builder.drawInfoSection(
      {
        name: company.name,
        address: company.companyAddress ?? null,
        phone: company.phone ?? null,
        email: company.tenantSlug ? `info@${company.tenantSlug}.com` : null,
      },
      {
        name: client.name,
        taxId: client.taxId ?? null,
        address: client.address ?? null,
        email: client.email ?? null,
        phone: client.phone ?? null,
      },
      quote.validUntil ? quote.validUntil.toISOString() : null
    );

    // Description
    if (quote.description) {
      builder.drawDescriptionBlock(quote.description);
    }

    // Items table
    const items = (quote.items ?? []).filter((i) => i.description);
    if (items.length > 0) {
      builder.drawItemsTable(
        items.map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          unit: i.unit,
          unitPrice: i.unitPrice,
          total: i.total,
        }))
      );
    }

    // Totals
    const subtotal = Number(quote.subtotal);
    const discountPercent = Number(quote.discountPercent);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxRate = Number(quote.taxRate);
    const taxAmount = Number(quote.taxAmount);
    const total = Number(quote.total);
    builder.drawTotalsBox(subtotal, discountPercent, discountAmount, taxRate, taxAmount, total);

    // Conditions
    const condText = [quote.notes, quote.clientNotes].filter(Boolean).join("\n\n");
    if (condText) {
      builder.drawConditionsBox(condText);
    }

    // Signature block (empty or filled)
    await builder.drawSignatureBlock({
      signaturePngUrl: opts.signaturePngUrl ?? null,
      signedBy: opts.signedBy ?? null,
      signedAt: opts.signedAt ?? null,
    });

    // Footer on last page
    builder.drawFooter();

    return { pdfDoc, quote, company, client };
  }

  async generateQuotePdf(
    companyId: string,
    quoteId: string,
    lang: Lang = "ca"
  ): Promise<{ buffer: Buffer; url: string }> {
    const { pdfDoc, quote, company, client } = await this.buildQuoteDocument({
      companyId,
      quoteId,
      lang,
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const ctx: StorageContext = {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self-hosted" ? "self-hosted" : "cloud",
      companyId,
      tenantSlug: company.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };

    const storageKey = buildQuotePdfKey(ctx, quote.number, lang);
    const uploadResult = await this.storage.upload({
      buffer,
      storageKey,
      mimeType: "application/pdf",
    });

    // Persist pdfUrl in database (enables re-download from UI)
    await db
      .update(quotes)
      .set({ pdfUrl: uploadResult.publicUrl })
      .where(eq(quotes.id, quoteId));

    return { buffer, url: uploadResult.publicUrl };
  }

  /**
   * Generate a signed version of the quote PDF. Embeds the client signature
   * in the "Acceptacio del Pressupost" block and stores it under a different
   * key (signed-quote-{lang}.pdf).
   *
   * Used by acceptQuoteAction when a client signs the quote.
   */
  async generateSignedQuotePdf(
    companyId: string,
    quoteId: string,
    signaturePngUrl: string,
    signedBy: string,
    signedAt: Date = new Date(),
    lang: Lang = "ca"
  ): Promise<{ buffer: Buffer; url: string }> {
    const { pdfDoc, quote, company, client } = await this.buildQuoteDocument({
      companyId,
      quoteId,
      lang,
      signaturePngUrl,
      signedBy,
      signedAt,
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const ctx: StorageContext = {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self-hosted" ? "self-hosted" : "cloud",
      companyId,
      tenantSlug: company.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };

    const storageKey = buildSignedQuoteKey(ctx, quote.number, lang);
    const uploadResult = await this.storage.upload({
      buffer,
      storageKey,
      mimeType: "application/pdf",
    });

    return { buffer, url: uploadResult.publicUrl };
  }

  async deletePdf(companyId: string, workOrderId: string) {
    const orderData = await workOrderService.getByIdWithRelations(companyId, workOrderId);
    if (!orderData) {
      throw new Error("Work order not found or access denied");
    }
    const { workOrder, client } = orderData;

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const ctx: StorageContext = {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self-hosted" ? "self-hosted" : "cloud",
      companyId,
      tenantSlug: company?.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };

    // Delete from storage (try all language variants)
    const langs: Lang[] = ["ca", "es", "en"];
    for (const lang of langs) {
      const storageKey = buildWorkOrderReportKey(ctx, workOrder.number, lang);
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
