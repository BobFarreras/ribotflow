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
import type { FileStorage } from "@/services/storage/interface";
import { createFileStorage } from "@/services/storage/factory";
import {
  buildQuotePdfKey,
  buildSignedQuoteKey,
  buildWorkOrderReportKey,
  type StorageContext,
} from "@/lib/utils/storageKeys";
import type { Lang, QuoteItemRow } from "./types";

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
      company: {
        name: data.company.name,
        address: data.company.companyAddress,
        phone: data.company.phone,
        email: data.company.tenantSlug ? `info@${data.company.tenantSlug}.com` : null,
        taxId: data.company.taxId,
      },
      client: {
        name: data.client.name,
        taxId: data.client.taxId,
        address: data.client.address,
        email: data.client.email,
        phone: data.client.phone,
      },
      validUntil: data.quote.validUntil ? data.quote.validUntil.toISOString() : null,
      description: data.quote.description,
      items: (data.quote.items ?? []).filter((i) => i.description).map((i) => ({
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
      company: {
        name: data.company.name,
        address: data.company.companyAddress,
        phone: data.company.phone,
        email: data.company.tenantSlug ? `info@${data.company.tenantSlug}.com` : null,
        taxId: data.company.taxId,
      },
      client: {
        name: data.client.name,
        taxId: data.client.taxId,
        address: data.client.address,
        email: data.client.email,
        phone: data.client.phone,
      },
      validUntil: data.quote.validUntil ? data.quote.validUntil.toISOString() : null,
      description: data.quote.description,
      items: (data.quote.items ?? []).filter((i) => i.description).map((i) => ({
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

  /* ---------- Helpers ---------- */
  private async fetchQuoteData(companyId: string, quoteId: string) {
    const { quoteService } = await import("@/services/sat/quoteService");
    const quote = await quoteService.getById(companyId, quoteId);
    if (!quote) throw new Error("Quote not found or access denied");

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!company) throw new Error("Company not found");

    const [client] = await db.select().from(clients).where(eq(clients.id, quote.clientId)).limit(1);
    if (!client) throw new Error("Client not found for this quote");

    return { quote, company, client };
  }

  private buildContext(
    companyId: string,
    company: { tenantSlug: string },
    client: { id: string; name: string }
  ): StorageContext {
    return {
      mode: process.env.NEXT_PUBLIC_APP_MODE === "self-hosted" ? "self-hosted" : "cloud",
      companyId,
      tenantSlug: company.tenantSlug,
      clientId: client.id,
      clientName: client.name,
    };
  }
}

export const pdfService = new PdfService(createFileStorage());
