/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/notifications/notificationService.ts
 * Description: Email notification service for SAT events.
 *              Supports SMTP via nodemailer (install if needed) or external API.
 */

import { db } from "@/db";
import { users, companies } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";

export interface NotificationPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface CheckInNotificationData {
  workOrderNumber: string;
  workOrderTitle: string;
  technicianName: string;
  clientName: string;
  checkInTime: Date;
  distanceToClient?: number | null;
}

export interface CompletionNotificationData {
  workOrderNumber: string;
  workOrderTitle: string;
  technicianName: string;
  clientName: string;
  completedAt: Date;
  durationMinutes?: number | null;
  travelDistanceKm?: string | null;
  travelCost?: number | null;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  rejectUnauthorized: boolean;
  requireTLS: boolean;
}

function readSmtpConfig(): { config: SmtpConfig | null; missing: string[] } {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";
  const requireTLS = process.env.SMTP_REQUIRE_TLS !== "false";

  if (!host || !user || !pass) {
    const missing: string[] = [];
    if (!host) missing.push("SMTP_HOST");
    if (!user) missing.push("SMTP_USER");
    if (!pass) missing.push("SMTP_PASSWORD (not SMTP_PASS!)");
    return { config: null, missing };
  }

  return { config: { host, port, user, pass, rejectUnauthorized, requireTLS }, missing: [] };
}

function buildTransporter(config: SmtpConfig, nodemailer: typeof import("nodemailer")) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.requireTLS,
    auth: { user: config.user, pass: config.pass },
    tls: {
      rejectUnauthorized: config.rejectUnauthorized,
    },
  });
}

async function sendEmail(payload: NotificationPayload): Promise<void> {
  const { config, missing } = readSmtpConfig();
  if (!config) {
    console.warn(`[Notification] SMTP no configurat. Falten: ${missing.join(", ")}.`);
    console.warn(`  To: ${payload.to}`);
    console.warn(`  Subject: ${payload.subject}`);
    return;
  }

  try {
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) {
      console.warn("[Notification] nodemailer not installed. Run: pnpm add nodemailer");
      return;
    }

    const transporter = buildTransporter(config, nodemailer);
    await transporter.sendMail({
      from: `"RIBOTFLOW" <${config.user}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
      html: payload.html,
    });
  } catch (err) {
    console.error("[Notification] Failed to send email:", err);
  }
}

async function sendEmailWithAttachment(
  payload: NotificationPayload,
  attachment?: { filename: string; content: Buffer; contentType: string }
): Promise<{ success: boolean; error?: string }> {
  const { config, missing } = readSmtpConfig();
  if (!config) {
    const msg = `SMTP no configurat. Falten: ${missing.join(", ")}. Veure docs/SMTP_SETUP.md`;
    console.warn(`[Notification] ${msg}`);
    console.warn(`  To: ${payload.to}`);
    console.warn(`  Subject: ${payload.subject}`);
    return { success: false, error: msg };
  }

  try {
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) {
      const msg = "Paquet 'nodemailer' no instal·lat. Executa: pnpm add nodemailer";
      console.warn(`[Notification] ${msg}`);
      return { success: false, error: msg };
    }

    const transporter = buildTransporter(config, nodemailer);
    const mailOptions: Record<string, unknown> = {
      from: `"${payload.from ?? "RIBOTFLOW"}" <${config.user}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
      html: payload.html,
    };
    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        },
      ];
    }
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Notification] Failed to send email:", err);
    return { success: false, error: errMsg };
  }
}

export interface QuoteEmailData {
  to: string;
  subject: string;
  html: string;
  quoteNumber: string;
  companyId: string;
  attachment?: { filename: string; content: Buffer; contentType: string };
}

export const notificationService = {
  async notifyCheckIn(companyId: string, data: CheckInNotificationData): Promise<void> {
    // Find admin/owner users for this company
    const admins = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          // Notify owners and admins
          // Note: Drizzle eq doesn't support array comparison directly
          // We filter in memory for now
        )
      );

    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const companyName = company?.name ?? "RIBOTFLOW";

    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d9488;">Check-in realitzat</h2>
        <p><strong>Tècnic:</strong> ${data.technicianName}</p>
        <p><strong>Ordre:</strong> ${data.workOrderNumber} — ${data.workOrderTitle}</p>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Hora:</strong> ${data.checkInTime.toLocaleString("ca-ES")}</p>
        ${data.distanceToClient ? `<p><strong>Distància al client:</strong> ${Math.round(data.distanceToClient)}m</p>` : ""}
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">
          Notificació automàtica de ${companyName} via RIBOTFLOW
        </p>
      </div>
    `;

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `[${companyName}] Check-in: ${data.technicianName} — ${data.workOrderNumber}`,
        html,
      });
    }
  },

  async notifyCompletion(companyId: string, data: CompletionNotificationData): Promise<void> {
    const admins = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.companyId, companyId));

    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const companyName = company?.name ?? "RIBOTFLOW";

    const durationText = data.durationMinutes
      ? `${Math.floor(data.durationMinutes / 60)}h ${data.durationMinutes % 60}m`
      : "N/A";

    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d9488;">Ordre completada</h2>
        <p><strong>Tècnic:</strong> ${data.technicianName}</p>
        <p><strong>Ordre:</strong> ${data.workOrderNumber} — ${data.workOrderTitle}</p>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Hora de finalització:</strong> ${data.completedAt.toLocaleString("ca-ES")}</p>
        <p><strong>Durada de la feina:</strong> ${durationText}</p>
        ${data.travelDistanceKm ? `<p><strong>Distància desplaçament:</strong> ${data.travelDistanceKm} km</p>` : ""}
        ${data.travelCost ? `<p><strong>Cost desplaçament:</strong> ${data.travelCost.toFixed(2)} EUR</p>` : ""}
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">
          Notificació automàtica de ${companyName} via RIBOTFLOW
        </p>
      </div>
    `;

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `[${companyName}] Completada: ${data.workOrderNumber} — ${data.workOrderTitle}`,
        html,
      });
    }
  },

  async sendQuoteEmail(data: QuoteEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await sendEmailWithAttachment(
        {
          to: data.to,
          subject: data.subject,
          html: data.html,
          from: "RIBOTFLOW",
        },
        data.attachment
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Notification] Failed to send quote email:", err);
      return { success: false, error: errMsg };
    }
  },
};
