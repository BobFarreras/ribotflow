/**
 * Creation/modification date: 01/06/2026
 * Path: src/actions/sat/acceptQuote.ts
 * Description: Server Action to accept a quote with client signature.
 *              Saves signature, generates signed PDF, updates quote status.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quotes, quoteStatusHistory } from "@/db/schema/sat";
import { eq, and } from "drizzle-orm";
import { signatureService } from "@/services/sat/signatureService";
import { pdfService } from "@/services/pdf";
import { revalidatePath } from "next/cache";

const MAX_SVG_LENGTH = 500_000;

export interface AcceptQuoteInput {
  quoteId: string;
  signedBy: string;
  signedByEmail?: string;
  signatureSvg: string;
  signaturePng: string; // base64-encoded PNG
}

export async function acceptQuoteAction(input: AcceptQuoteInput) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "No autenticat" };
    }

    if (!input.quoteId || !input.signedBy || !input.signatureSvg) {
      return { success: false, error: "Falten camps obligatoris" };
    }
    if (input.signatureSvg.length > MAX_SVG_LENGTH) {
      return { success: false, error: "La signatura és massa gran" };
    }

    const companyId = session.user.companyId;

    // Validate quote
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, input.quoteId), eq(quotes.companyId, companyId)))
      .limit(1);
    if (!quote) {
      return { success: false, error: "Pressupost no trobat" };
    }
    if (quote.status === "accepted") {
      return { success: false, error: "Aquest pressupost ja ha estat acceptat" };
    }
    if (quote.status === "rejected" || quote.status === "cancelled") {
      return { success: false, error: `No es pot acceptar un pressupost ${quote.status}` };
    }

    // Decode base64 PNG
    const base64Data = input.signaturePng.replace(/^data:image\/png;base64,/, "");
    const pngBuffer = Buffer.from(base64Data, "base64");

    // 1. Save signature (uploads PNG, saves SVG + metadata)
    const signature = await signatureService.save(companyId, quote.number, {
      entityType: "quote",
      entityId: quote.id,
      signedBy: input.signedBy,
      signatureSvg: input.signatureSvg,
      signaturePngBuffer: pngBuffer,
    });

    if (!signature.signaturePngUrl) {
      return { success: false, error: "Error guardant la signatura" };
    }

    const acceptedAt = new Date();

    // 2. Generate signed PDF
    const signedPdf = await pdfService.generateSignedQuotePdf(
      companyId,
      quote.id,
      signature.signaturePngUrl,
      input.signedBy,
      acceptedAt
    );

    // 3. Update quote status + acceptance metadata
    await db
      .update(quotes)
      .set({
        status: "accepted",
        acceptedAt,
        acceptedByName: input.signedBy,
        acceptedByEmail: input.signedByEmail ?? null,
        signaturePngUrl: signature.signaturePngUrl,
        pdfUrl: signedPdf.url,
        sentAt: quote.sentAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quote.id));

    // 4. Append status history
    await db.insert(quoteStatusHistory).values({
      quoteId: quote.id,
      statusFrom: quote.status,
      statusTo: "accepted",
      changedBy: session.user.id,
      reason: `Acceptat per ${input.signedBy}${input.signedByEmail ? ` <${input.signedByEmail}>` : ""}`,
    });

    revalidatePath(`/sat/quotes/${quote.id}`);
    revalidatePath("/sat/quotes");

    return {
      success: true,
      data: {
        quoteId: quote.id,
        signedPdfUrl: signedPdf.url,
        signatureUrl: signature.signaturePngUrl,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error en acceptar el pressupost" };
  }
}

export interface RejectQuoteInput {
  quoteId: string;
  reason: string;
}

export async function rejectQuoteAction(input: RejectQuoteInput) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "No autenticat" };
    }

    if (!input.quoteId || !input.reason?.trim()) {
      return { success: false, error: "Falten camps obligatoris" };
    }

    const companyId = session.user.companyId;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, input.quoteId), eq(quotes.companyId, companyId)))
      .limit(1);
    if (!quote) {
      return { success: false, error: "Pressupost no trobat" };
    }
    if (quote.status === "rejected" || quote.status === "cancelled") {
      return { success: false, error: `Aquest pressupost ja està ${quote.status}` };
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
      changedBy: session.user.id,
      reason: input.reason.trim(),
    });

    revalidatePath(`/sat/quotes/${quote.id}`);
    revalidatePath("/sat/quotes");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error en rebutjar el pressupost" };
  }
}
