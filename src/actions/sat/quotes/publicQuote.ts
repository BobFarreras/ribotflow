/**
 * Creation/modification date: 12/06/2026
 * Path: src/actions/sat/quotes/publicQuote.ts
 * Description: Public Server Actions for quote sharing.
 *              No authentication required — uses share token for authorization.
 */

"use server";

import { db } from "@/db";
import { quotes, quoteStatusHistory, quoteItems } from "@/db/schema/sat";
import { companies } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { pdfService } from "@/services/pdf";
import { revalidatePath } from "next/cache";

export interface PublicQuoteData {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  validUntil: Date | null;
  subtotal: string;
  discountPercent: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  currency: string;
  clientNotes: string | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  acceptedByName: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  companyName: string;
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: string;
    discountPercent: string;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    total: string;
    category: string;
  }[];
}

export async function getQuoteByToken(token: string): Promise<{
  success: boolean;
  data?: PublicQuoteData;
  error?: string;
}> {
  try {
    if (!token?.trim()) {
      return { success: false, error: "Token no proporcionat" };
    }

    const [quote] = await db
      .select({
        id: quotes.id,
        number: quotes.number,
        title: quotes.title,
        description: quotes.description,
        status: quotes.status,
        validUntil: quotes.validUntil,
        subtotal: quotes.subtotal,
        discountPercent: quotes.discountPercent,
        taxRate: quotes.taxRate,
        taxAmount: quotes.taxAmount,
        total: quotes.total,
        currency: quotes.currency,
        clientNotes: quotes.clientNotes,
        sentAt: quotes.sentAt,
        acceptedAt: quotes.acceptedAt,
        acceptedByName: quotes.acceptedByName,
        rejectedAt: quotes.rejectedAt,
        rejectionReason: quotes.rejectionReason,
        shareToken: quotes.shareToken,
        shareTokenExpiresAt: quotes.shareTokenExpiresAt,
      })
      .from(quotes)
      .where(eq(quotes.shareToken, token))
      .limit(1);

    if (!quote) {
      return { success: false, error: "Pressupost no trobat" };
    }

    // Check expiry
    if (quote.shareTokenExpiresAt && new Date(quote.shareTokenExpiresAt) < new Date()) {
      return { success: false, error: "L'enllaç ha expirat" };
    }

    // Check status — only sent quotes can be viewed publicly
    if (quote.status === "draft" || quote.status === "cancelled") {
      return { success: false, error: "Aquest pressupost no està disponible" };
    }

    // Fetch items
    const items = await db
      .select({
        description: quoteItems.description,
        quantity: quoteItems.quantity,
        unit: quoteItems.unit,
        unitPrice: quoteItems.unitPrice,
        discountPercent: quoteItems.discountPercent,
        subtotal: quoteItems.subtotal,
        taxRate: quoteItems.taxRate,
        taxAmount: quoteItems.taxAmount,
        total: quoteItems.total,
        category: quoteItems.category,
      })
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quote.id));

    // Fetch company name
    const [{ name: companyName }] = await db
      .select({ name: companies.name })
      .from(companies)
      .innerJoin(quotes, eq(quotes.companyId, companies.id))
      .where(eq(quotes.id, quote.id))
      .limit(1);

    return {
      success: true,
      data: {
        id: quote.id,
        number: quote.number,
        title: quote.title,
        description: quote.description,
        status: quote.status,
        validUntil: quote.validUntil,
        subtotal: quote.subtotal,
        discountPercent: quote.discountPercent,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        currency: quote.currency,
        clientNotes: quote.clientNotes,
        sentAt: quote.sentAt,
        acceptedAt: quote.acceptedAt,
        acceptedByName: quote.acceptedByName,
        rejectedAt: quote.rejectedAt,
        rejectionReason: quote.rejectionReason,
        companyName,
        items: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          subtotal: item.subtotal,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          total: item.total,
          category: item.category,
        })),
      },
    };
  } catch (error) {
    console.error("[getQuoteByToken]", error);
    return { success: false, error: "Error intern" };
  }
}

export interface AcceptQuotePublicInput {
  token: string;
  acceptedBy: string;
  acceptedByEmail?: string;
}

export async function acceptQuotePublicAction(input: AcceptQuotePublicInput): Promise<{
  success: boolean;
  error?: string;
  pdfUrl?: string;
}> {
  try {
    if (!input.token?.trim() || !input.acceptedBy?.trim()) {
      return { success: false, error: "Falten camps obligatoris" };
    }

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.shareToken, input.token))
      .limit(1);

    if (!quote) {
      return { success: false, error: "Pressupost no trobat" };
    }

    if (quote.shareTokenExpiresAt && new Date(quote.shareTokenExpiresAt) < new Date()) {
      return { success: false, error: "L'enllaç ha expirat" };
    }

    if (quote.status === "accepted") {
      return { success: false, error: "Aquest pressupost ja ha estat acceptat" };
    }

    if (quote.status === "rejected" || quote.status === "cancelled") {
      return { success: false, error: `No es pot acceptar un pressupost ${quote.status}` };
    }

    const acceptedAt = new Date();

    // Generate signed PDF (without signature image — public acceptance)
    let pdfUrl: string | null = null;
    try {
      const signedPdf = await pdfService.generateSignedQuotePdf(
        quote.companyId,
        quote.id,
        "", // no signature image
        input.acceptedBy,
        acceptedAt
      );
      pdfUrl = signedPdf.url;
    } catch (pdfErr) {
      console.warn("[acceptQuotePublicAction] PDF generation failed:", pdfErr);
    }

    await db
      .update(quotes)
      .set({
        status: "accepted",
        acceptedAt,
        acceptedByName: input.acceptedBy,
        acceptedByEmail: input.acceptedByEmail ?? null,
        pdfUrl: pdfUrl ?? quote.pdfUrl,
        sentAt: quote.sentAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quote.id));

    await db.insert(quoteStatusHistory).values({
      quoteId: quote.id,
      statusFrom: quote.status,
      statusTo: "accepted",
      changedBy: null,
      reason: `Acceptat públicament per ${input.acceptedBy}${input.acceptedByEmail ? ` <${input.acceptedByEmail}>` : ""}`,
    });

    revalidatePath(`/sat/quotes/${quote.id}`);
    revalidatePath("/sat/quotes");

    return { success: true, pdfUrl: pdfUrl ?? undefined };
  } catch (error) {
    console.error("[acceptQuotePublicAction]", error);
    return { success: false, error: "Error en acceptar el pressupost" };
  }
}

export interface RejectQuotePublicInput {
  token: string;
  reason: string;
}

export async function rejectQuotePublicAction(input: RejectQuotePublicInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!input.token?.trim() || !input.reason?.trim()) {
      return { success: false, error: "Falten camps obligatoris" };
    }

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.shareToken, input.token))
      .limit(1);

    if (!quote) {
      return { success: false, error: "Pressupost no trobat" };
    }

    if (quote.shareTokenExpiresAt && new Date(quote.shareTokenExpiresAt) < new Date()) {
      return { success: false, error: "L'enllaç ha expirat" };
    }

    if (quote.status === "rejected") {
      return { success: false, error: "Aquest pressupost ja està rebutjat" };
    }

    if (quote.status === "accepted") {
      return { success: false, error: "Aquest pressupost ja ha estat acceptat" };
    }

    const rejectedAt = new Date();

    await db
      .update(quotes)
      .set({
        status: "rejected",
        rejectedAt,
        rejectionReason: input.reason.trim(),
        updatedAt: rejectedAt,
      })
      .where(eq(quotes.id, quote.id));

    await db.insert(quoteStatusHistory).values({
      quoteId: quote.id,
      statusFrom: quote.status,
      statusTo: "rejected",
      changedBy: null,
      reason: input.reason.trim(),
    });

    revalidatePath(`/sat/quotes/${quote.id}`);
    revalidatePath("/sat/quotes");

    return { success: true };
  } catch (error) {
    console.error("[rejectQuotePublicAction]", error);
    return { success: false, error: "Error en rebutjar el pressupost" };
  }
}
