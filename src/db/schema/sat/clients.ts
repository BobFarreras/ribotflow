/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/clients.ts
 * Description: Clients table — shared with future CRM module.
 *              Enhanced with contacts, categories, and extended fiscal data.
 */

import { pgTable, uuid, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    location: jsonb("location").$type<{ lat: number; lng: number }>(),
    taxId: text("tax_id"),
    // Enhanced CRM fields
    website: text("website"),
    notes: text("notes"),
    fiscalData: jsonb("fiscal_data").$type<{
      iban?: string;
      activityCode?: string;
      registrationDate?: string;
    }>(),
    categoryId: uuid("category_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("idx_clients_company_id").on(table.companyId),
    emailIdx: index("idx_clients_email").on(table.email),
    categoryIdx: index("idx_clients_category_id").on(table.categoryId),
  })
);

import { workOrders } from "./workOrders";
import { quotes } from "./quotes";
import { clientContacts } from "./clientContacts";
import { clientCategories } from "./clientCategories";

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  category: one(clientCategories, {
    fields: [clients.categoryId],
    references: [clientCategories.id],
  }),
  workOrders: many(workOrders),
  quotes: many(quotes),
  contacts: many(clientContacts),
}));
