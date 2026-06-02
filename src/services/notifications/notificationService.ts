/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/notifications/notificationService.ts
 * Description: Email notification service for SAT events.
 *              Supports SMTP via nodemailer (install if needed) or external API.
 */

import { db } from "@/db";
import { users, companies } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { isCertError, certErrorHelp } from "@/lib/utils/smtpErrors";
import { checkInTemplate, completionTemplate } from "./emailTemplates";

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
  // SMTP_TLS_REJECT_UNAUTHORIZED=false → accept self-signed certs (DEV ONLY)
  // NODE_TLS_REJECT_UNAUTHORIZED=0 → Node-level bypass (more aggressive, also DEV ONLY)
  const envReject = process.env.SMTP_TLS_REJECT_UNAUTHORIZED;
  const nodeReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  const rejectUnauthorized =
    envReject !== undefined ? envReject !== "false" : !(nodeReject === "0" || nodeReject === "false");
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

async function resolveSmtpConfig(companyId: string): Promise<{
  config: SmtpConfig | null;
  source: "db" | "env" | "missing";
  fromName?: string;
  fromEmail?: string;
  missing: string[];
}> {
  try {
    const { smtpConfigService } = await import("@/services/sat/company/smtpConfigService");
    const dbConfig = await smtpConfigService.getByCompany(companyId);
    if (dbConfig) {
      return {
        config: {
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          pass: dbConfig.password,
          rejectUnauthorized: !dbConfig.acceptSelfSigned,
          requireTLS: dbConfig.port !== 465,
        },
        source: "db",
        fromName: dbConfig.fromName ?? undefined,
        fromEmail: dbConfig.fromEmail ?? undefined,
        missing: [],
      };
    }
  } catch (err) {
    console.warn("[Notification] Could not load SMTP config from DB, falling back to env:", err);
  }

  const env = readSmtpConfig();
  return { ...env, source: env.config ? "env" : "missing" };
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

async function sendEmail(payload: NotificationPayload, companyId: string): Promise<void> {
  const { config, missing, source, fromName, fromEmail } = await resolveSmtpConfig(companyId);
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
    const fromAddress = fromEmail ?? config.user;
    const fromLabel = fromName ?? payload.from ?? "RIBOTFLOW";
    await transporter.sendMail({
      from: `"${fromLabel}" <${fromAddress}>`,
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
  companyId: string,
  attachment?: { filename: string; content: Buffer; contentType: string }
): Promise<{ success: boolean; error?: string }> {
  const { config, missing, source, fromName, fromEmail } = await resolveSmtpConfig(companyId);
  if (!config) {
    const msg = `SMTP no configurat per aquesta empresa. Falten: ${missing.join(", ")}. Configura-ho a /settings/email o via SMTP_* env vars.`;
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
    console.log(
      `[Notification] SMTP source=${source} host=${config.host} port=${config.port} secure=${config.port === 465} requireTLS=${config.requireTLS} tls.rejectUnauthorized=${config.rejectUnauthorized} (set SMTP_TLS_REJECT_UNAUTHORIZED=false to accept self-signed certs)`
    );
    const fromAddress = fromEmail ?? config.user;
    const fromLabel = fromName ?? payload.from ?? "RIBOTFLOW";
    const mailOptions: Record<string, unknown> = {
      from: `"${fromLabel}" <${fromAddress}>`,
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
    if (isCertError(err)) {
      console.error("[Notification] " + certErrorHelp());
      return { success: false, error: `${errMsg} — ${certErrorHelp().split("\n")[0]}` };
    }
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

async function loadCompanyAndAdmins(companyId: string): Promise<{
  companyName: string;
  admins: { email: string; name: string }[];
}> {
  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  const admins = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.companyId, companyId));
  return { companyName: company?.name ?? "RIBOTFLOW", admins };
}

export const notificationService = {
  async notifyCheckIn(companyId: string, data: CheckInNotificationData): Promise<void> {
    const { companyName, admins } = await loadCompanyAndAdmins(companyId);
    const html = checkInTemplate(data, companyName);
    for (const admin of admins) {
      await sendEmail(
        {
          to: admin.email,
          subject: `[${companyName}] Check-in: ${data.technicianName} — ${data.workOrderNumber}`,
          html,
        },
        companyId
      );
    }
  },

  async notifyCompletion(companyId: string, data: CompletionNotificationData): Promise<void> {
    const { companyName, admins } = await loadCompanyAndAdmins(companyId);
    const html = completionTemplate(data, companyName);
    for (const admin of admins) {
      await sendEmail(
        {
          to: admin.email,
          subject: `[${companyName}] Completada: ${data.workOrderNumber} — ${data.workOrderTitle}`,
          html,
        },
        companyId
      );
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
        data.companyId,
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
