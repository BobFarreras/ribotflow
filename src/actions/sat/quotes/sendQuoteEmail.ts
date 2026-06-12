/**
 * Creation/modification date: 01/06/2026
 * Path: src/actions/sat/sendQuoteEmail.ts
 * Description: Server Action to send a quote via email with PDF attachment.
 *              Generates PDF, attaches it, and sends via SMTP.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies } from "@/db/schema/auth";
import { clients } from "@/db/schema/sat";
import { eq } from "drizzle-orm";
import { quoteService } from "@/services/sat/quotes/quoteService";
import { pdfService } from "@/services/pdf";
import { notificationService } from "@/services/notifications/notificationService";

interface SendQuoteEmailInput {
  quoteId: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  message?: string;
}

export async function sendQuoteEmailAction(input: SendQuoteEmailInput) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return { success: false as const, error: "No autenticat" };
  }

  const companyId = session.user.companyId;

  // Fetch quote
  const quote = await quoteService.getById(companyId, input.quoteId);
  if (!quote) {
    return { success: false as const, error: "Pressupost no trobat" };
  }

  // Fetch company info
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);

  const companyName = company?.name ?? "RIBOTFLOW";

  // Fetch client name if available
  let clientName = "";
  if (quote.clientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, quote.clientId)).limit(1);
    clientName = client?.name ?? "";
  }

  // Generate share token for public link
  const shareToken = await quoteService.ensureShareToken(quote.id);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/p/${shareToken}`;

  // Build email
  const subject = input.subject || `Pressupost ${quote.number} de ${companyName}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488; margin-bottom: 8px;">Pressupost ${quote.number}</h2>
      ${clientName ? `<p style="color: #6b7280; margin-top: 0;">Enviat a: ${clientName}</p>` : ""}

      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Títol:</strong> ${quote.title}</p>
        <p style="margin: 4px 0;"><strong>Import total:</strong> ${quote.total ?? "0.00"} EUR</p>
        <p style="margin: 4px 0;"><strong>Valid fins:</strong> ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString("ca-ES") : "Sense data límit"}</p>
      </div>

      ${
        input.message
          ? `
        <div style="margin: 16px 0;">
          <p style="white-space: pre-line;">${input.message}</p>
        </div>
      `
          : ""
      }

      <div style="text-align: center; margin: 24px 0;">
        <a href="${shareUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Veure i acceptar pressupost
        </a>
      </div>

      <p style="color: #6b7280; font-size: 13px;">
        Trobareu el pressupost adjunt en format PDF. També podeu acceptar o rebutjar directament fent clic al botó de dalt.
      </p>

      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af;">
        ${companyName} — Enviat via RIBOTFLOW
      </p>
    </div>
  `;

  // Generate PDF
  let attachment: { filename: string; content: Buffer; contentType: string } | undefined;
  try {
    const pdfResult = await pdfService.generateQuotePdf(companyId, input.quoteId, "ca");
    attachment = {
      filename: `Pressupost_${quote.number}.pdf`,
      content: pdfResult.buffer,
      contentType: "application/pdf",
    };
  } catch (pdfErr) {
    console.warn(
      "[sendQuoteEmailAction] PDF generation failed, sending without attachment:",
      pdfErr
    );
  }

  // Send email with PDF attachment
  const result = await notificationService.sendQuoteEmail({
    to: input.recipientEmail,
    subject,
    html,
    quoteNumber: quote.number,
    companyId,
    attachment,
  });

  if (result.success) {
    return {
      success: true as const,
      message: `Pressupost enviat a ${input.recipientEmail}${attachment ? " amb PDF adjunt" : ""}`,
    };
  }

  return {
    success: false as const,
    error: result.error ?? "Error en enviar l'email",
  };
}
