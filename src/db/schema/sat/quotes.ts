/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/quotes.ts
 * Description: Quotes linked to work orders.
 */

import { pgTable, uuid, text, timestamp, index, integer, numeric, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";
import { clients } from "./clients";
import { workOrders } from "./workOrders";
import { quoteTemplates } from "./quoteTemplates";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "set null" }),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "set null" })
      .notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status")
      .$type<
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      >()
      .default("draft")
      .notNull(),
    version: integer("version").default(1).notNull(),
    validUntil: timestamp("valid_until"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0").notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("21").notNull(),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("EUR").notNull(),
    notes: text("notes"),
    clientNotes: text("client_notes"),
    templateId: uuid("template_id"),
    pdfUrl: text("pdf_url"),
    sentAt: timestamp("sent_at"),
    acceptedAt: timestamp("accepted_at"),
    acceptedByName: text("accepted_by_name"),
    acceptedByEmail: text("accepted_by_email"),
    signaturePngUrl: text("signature_png_url"),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyStatusIdx: index("idx_quotes_company_status").on(table.companyId, table.status),
    companyCreatedIdx: index("idx_quotes_company_created").on(table.companyId, table.createdAt),
    workOrderIdx: index("idx_quotes_work_order").on(table.workOrderId),
    clientIdx: index("idx_quotes_client").on(table.clientId),
    numberUnique: unique("idx_quotes_number_unique").on(table.companyId, table.number),
  })
);

import { quoteItems } from "./quoteItems";
import { quoteStatusHistory } from "./quoteStatusHistory";

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  company: one(companies, {
    fields: [quotes.companyId],
    references: [companies.id],
  }),
  workOrder: one(workOrders, {
    fields: [quotes.workOrderId],
    references: [workOrders.id],
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  template: one(quoteTemplates, {
    fields: [quotes.templateId],
    references: [quoteTemplates.id],
  }),
  items: many(quoteItems),
  statusHistory: many(quoteStatusHistory),
}));