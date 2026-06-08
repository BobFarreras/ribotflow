/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/smtpConfigs.ts
 * Description: Per-company SMTP configuration with at-rest encryption for the password.
 *              One row per company (unique on company_id). The notificationService
 *              prefers this row over SMTP_* env vars when present.
 */

import { pgTable, uuid, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "../auth";

export const smtpConfigs = pgTable(
  "smtp_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    host: text("host").notNull(),
    port: integer("port").notNull().default(587),
    user: text("user").notNull(),
    passwordEncrypted: text("password_encrypted").notNull(),
    secure: boolean("secure").notNull().default(false),
    acceptSelfSigned: boolean("accept_self_signed").notNull().default(false),
    fromName: text("from_name"),
    fromEmail: text("from_email"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: uniqueIndex("uniq_smtp_configs_company_id").on(table.companyId),
  })
);

export type SmtpConfigRow = typeof smtpConfigs.$inferSelect;
export type NewSmtpConfigRow = typeof smtpConfigs.$inferInsert;
