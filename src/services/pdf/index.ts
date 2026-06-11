/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/index.ts
 * Description: PDF service orchestrator. Delegates layout to builders and
 *              components. Handles storage upload and DB persistence.
 */

import { PDFDocument, StandardFonts } from "pdf-lib";
import { db } from "@/db";
import { workOrders, quotes, clients } from "@/db/schema/sat";
import { companies } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { PdfBuilder } from "./builder/PdfBuilder";
import { buildQuotePdf } from "./builder/QuotePdfBuilder";
import { buildWorkOrderPdf } from "./builder/WorkOrderPdfBuilder";
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";
import {
  buildQuotePdfKey,
  buildSignedQuoteKey,
  buildWorkOrderReportKey,
  type StorageContext,
} from "@/lib/utils/storageKeys";
import { mapCompanyToBuilderInfo } from "./utils/companyMapper";
import type { Lang } from "./types";

export class PdfService {
  constructor(private readonly storage: FileStorage) {}

  /* ---------- Quote PDFs ---------- */
  async generateQuotePdf(
    companyId: string,
    quoteId: string,
    lang: Lang = "ca"
  ): Promise<{ buffer: Buffer; url: string }> {
    const data = await this.fetchQuoteData(companyId, quoteId);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const builder = new PdfBuilder(pdfDoc, font, fontBold, lang);

    await buildQuotePdf(builder, {
      quoteNumber: data.quote.number,
      company: mapCompanyToBuilderInfo(data.company),
      client: {
        name: data.client.name,
        taxId: data.client.taxId,
        address: data.client.address,
        email: data.client.email,
        phone: data.client.phone,
      },
      validUntil: data.quote.validUntil ? data.quote.validUntil.toISOString() : null,
      description: data.quote.description,
      items: (data.quote.items ?? [])
        .filter((i) => i.description)
        .map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          unit: i.unit,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
      subtotal: Number(data.quote.subtotal),
      discountPercent: Number(data.quote.discountPercent),
      discountAmount: Number(data.quote.subtotal) * (Number(data.quote.discountPercent) / 100),
      taxRate: Number(data.quote.taxRate),
      taxAmount: Number(data.quote.taxAmount),
      total: Number(data.quote.total),
      conditions: [data.quote.notes, data.quote.clientNotes].filter(Boolean).join("\n\n") || null,
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const ctx = this.buildContext(companyId, data.company, data.client);
    const storageKey = buildQuotePdfKey(ctx, data.quote.number, lang);
    const upload = await this.storage.upload({ buffer, storageKey, mimeType: "application/pdf" });

    await db.update(quotes).set({ pdfUrl: upload.publicUrl }).where(eq(quotes.id, quoteId));
    return { buffer, url: upload.publicUrl };
  }

  async generateSignedQuotePdf(
    companyId: string,
    quoteId: string,
    signaturePngUrl: string,
    signedBy: string,
    signedAt: Date = new Date(),
    lang: Lang = "ca"
  ): Promise<{ buffer: Buffer; url: string }> {
    const data = await this.fetchQuoteData(companyId, quoteId);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const builder = new PdfBuilder(pdfDoc, font, fontBold, lang);

    await buildQuotePdf(builder, {
      quoteNumber: data.quote.number,
      company: mapCompanyToBuilderInfo(data.company),
      client: {
        name: data.client.name,
        taxId: data.client.taxId,
        address: data.client.address,
        email: data.client.email,
        phone: data.client.phone,
      },
      validUntil: data.quote.validUntil ? data.quote.validUntil.toISOString() : null,
      description: data.quote.description,
      items: (data.quote.items ?? [])
        .filter((i) => i.description)
        .map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          unit: i.unit,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
      subtotal: Number(data.quote.subtotal),
      discountPercent: Number(data.quote.discountPercent),
      discountAmount: Number(data.quote.subtotal) * (Number(data.quote.discountPercent) / 100),
      taxRate: Number(data.quote.taxRate),
      taxAmount: Number(data.quote.taxAmount),
      total: Number(data.quote.total),
      conditions: [data.quote.notes, data.quote.clientNotes].filter(Boolean).join("\n\n") || null,
      signaturePngUrl,
      signedBy,
      signedAt,
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const ctx = this.buildContext(companyId, data.company, data.client);
    const storageKey = buildSignedQuoteKey(ctx, data.quote.number, lang);
    const upload = await this.storage.upload({ buffer, storageKey, mimeType: "application/pdf" });

    return { buffer, url: upload.publicUrl };
  }

  /* ---------- Work Order PDFs ---------- */
  async generateWorkOrderPdf(
    companyId: string,
    workOrderId: string,
    lang: Lang = "ca"
  ): Promise<{ url: string }> {
    const data = await this.fetchWorkOrderData(companyId, workOrderId);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const builder = new PdfBuilder(pdfDoc, font, fontBold, lang);

    await buildWorkOrderPdf(builder, {
      workOrderNumber: data.workOrder.number,
      companyName: data.company.name,
      companyLogoUrl: data.company.logoUrl,
      companyLegalText: data.company.legalText,
      companyWebsite: data.company.website,
      clientName: data.client.name,
      clientPhone: data.client.phone,
      clientEmail: data.client.email,
      clientAddress: data.client.address,
      status: data.workOrder.status,
      priority: data.workOrder.priority,
      categoryName: data.category.name,
      scheduledDate: data.workOrder.scheduledDate,
      startedAt: data.workOrder.startedAt,
      completedAt: data.workOrder.completedAt,
      description: data.workOrder.description,
      materials: data.materials.map((m) => ({
        name: m.name,
        quantity: String(m.quantity),
        unitPrice: m.unitPrice,
      })),
      photos: data.attachments
        .filter((a) => a.type === "photo" && a.url)
        .map((a) => ({
          url: a.url!,
          fileName: a.fileName,
          isBefore: a.isBefore,
          caption: a.caption,
        })),
      signaturePngUrl: data.signature?.signaturePngUrl ?? null,
      signedBy: data.signature?.signedBy ?? null,
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const ctx = this.buildContext(companyId, data.company, data.client);
    const storageKey = buildWorkOrderReportKey(ctx, data.workOrder.number, lang);
    const upload = await this.storage.upload({ buffer, storageKey, mimeType: "application/pdf" });

    await db
      .update(workOrders)
      .set({ pdfUrl: upload.publicUrl })
      .where(eq(workOrders.id, workOrderId));
    return { url: upload.publicUrl };
  }

  async deleteWorkOrderPdf(companyId: string, workOrderId: string) {
    const data = await this.fetchWorkOrderData(companyId, workOrderId);
    const ctx = this.buildContext(companyId, data.company, data.client);

    const langs: Lang[] = ["ca", "es", "en"];
    for (const lang of langs) {
      const storageKey = buildWorkOrderReportKey(ctx, data.workOrder.number, lang);
      try {
        await this.storage.delete(storageKey);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    await db.update(workOrders).set({ pdfUrl: null }).where(eq(workOrders.id, workOrderId));
    return { success: true };
  }

  /* ---------- Helpers ---------- */
  private async fetchQuoteData(companyId: string, quoteId: string) {
    const { quoteService } = await import("@/services/sat/quotes/quoteService");
    const quote = await quoteService.getById(companyId, quoteId);
    if (!quote) throw new Error("Quote not found or access denied");

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!company) throw new Error("Company not found");

    const [client] = await db.select().from(clients).where(eq(clients.id, quote.clientId)).limit(1);
    if (!client) throw new Error("Client not found for this quote");

    return { quote, company, client };
  }

  private async fetchWorkOrderData(companyId: string, workOrderId: string) {
    const { workOrderService } = await import("@/services/sat/work-orders/workOrderService");
    const { materialService } = await import("@/services/sat/work-orders/materialService");
    const { attachmentService } = await import("@/services/sat/work-orders/attachmentService");
    const { signatureService } = await import("@/services/sat/work-orders/signatureService");

    const orderData = await workOrderService.getByIdWithRelations(companyId, workOrderId);
    if (!orderData) throw new Error("Work order not found or access denied");

    const [company] = await db
      .select({
        name: companies.name,
        tenantSlug: companies.tenantSlug,
        logoUrl: companies.logoUrl,
        legalText: companies.legalText,
        website: companies.website,
        phone: companies.phone,
        email: companies.email,
        taxId: companies.taxId,
      })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const materials = await materialService.getByWorkOrder(companyId, workOrderId);
    const attachments = await attachmentService.getByWorkOrder(companyId, workOrderId);
    const signature = await signatureService.getByEntity(companyId, "work_order", workOrderId);

    return {
      workOrder: orderData.workOrder,
      client: orderData.client,
      category: orderData.category,
      company: company ?? {
        name: "",
        tenantSlug: "",
        logoUrl: null,
        legalText: null,
        website: null,
        phone: null,
        email: null,
        taxId: null,
      },
      materials,
      attachments,
      signature,
    };
  }

  private buildContext(
    companyId: string,
    company: { tenantSlug: string },
    client: { id: string; name: string }
  ): StorageContext {
    return {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self_hosted" ? "self_hosted" : "cloud",
      companyId,
      tenantSlug: company.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };
  }
}

export const pdfService = new PdfService(createFileStorage());
