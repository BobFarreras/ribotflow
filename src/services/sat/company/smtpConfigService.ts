/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/sat/company/smtpConfigService.ts
 * Description: CRUD for per-company SMTP configuration. The password is encrypted
 *              at rest with AES-256-GCM (src/lib/utils/encryption).
 *              The notificationService prefers this row over SMTP_* env vars
 *              when one exists.
 */

import { db } from "@/db";
import { smtpConfigs, type SmtpConfigRow } from "@/db/schema/sat/smtpConfigs";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import nodemailer from "nodemailer";

export interface SmtpConfigPlain {
  id: string;
  companyId: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  acceptSelfSigned: boolean;
  fromName: string | null;
  fromEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmtpConfigInput {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  acceptSelfSigned: boolean;
  fromName?: string | null;
  fromEmail?: string | null;
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
}

function rowToPlain(row: SmtpConfigRow): SmtpConfigPlain {
  return {
    id: row.id,
    companyId: row.companyId,
    host: row.host,
    port: row.port,
    user: row.user,
    password: decrypt(row.passwordEncrypted),
    secure: row.secure,
    acceptSelfSigned: row.acceptSelfSigned,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const smtpConfigService = {
  async getByCompany(companyId: string): Promise<SmtpConfigPlain | null> {
    const rows = await db
      .select()
      .from(smtpConfigs)
      .where(eq(smtpConfigs.companyId, companyId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return rowToPlain(row);
  },

  async upsert(companyId: string, input: SmtpConfigInput): Promise<SmtpConfigRow> {
    const existing = await this.getByCompany(companyId);

    if (!existing) {
      const inserted = await db
        .insert(smtpConfigs)
        .values({
          companyId,
          host: input.host,
          port: input.port,
          user: input.user,
          passwordEncrypted: encrypt(input.password),
          secure: input.secure,
          acceptSelfSigned: input.acceptSelfSigned,
          fromName: input.fromName ?? null,
          fromEmail: input.fromEmail ?? null,
        })
        .returning();
      return inserted[0];
    }

    const nextPassword =
      input.password && input.password.length > 0 ? encrypt(input.password) : undefined;

    const updated = await db
      .update(smtpConfigs)
      .set({
        host: input.host,
        port: input.port,
        user: input.user,
        ...(nextPassword ? { passwordEncrypted: nextPassword } : {}),
        secure: input.secure,
        acceptSelfSigned: input.acceptSelfSigned,
        fromName: input.fromName ?? null,
        fromEmail: input.fromEmail ?? null,
        updatedAt: new Date(),
      })
      .where(eq(smtpConfigs.companyId, companyId))
      .returning();
    return updated[0];
  },

  async delete(companyId: string): Promise<void> {
    await db.delete(smtpConfigs).where(eq(smtpConfigs.companyId, companyId));
  },

  async testConnection(companyId: string): Promise<TestConnectionResult> {
    const cfg = await this.getByCompany(companyId);
    if (!cfg) {
      return { success: false, error: "No SMTP config for this company. Save one first." };
    }

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465 || cfg.secure,
      auth: { user: cfg.user, pass: cfg.password },
      tls: cfg.acceptSelfSigned ? { rejectUnauthorized: false } : undefined,
    });

    try {
      await transporter.verify();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (lower.includes("self-signed") || lower.includes("unable to verify")) {
        return {
          success: false,
          error: `${msg} — Tip: enable "Accept self-signed certificates" in the form for legacy/dev servers.`,
        };
      }
      return { success: false, error: msg };
    }
  },
};
