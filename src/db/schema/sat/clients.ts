/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/clients.ts
 * Description: Clients table — shared with future CRM module.
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("idx_clients_company_id").on(table.companyId),
    emailIdx: index("idx_clients_email").on(table.email),
  })
);

import { workOrders } from "./workOrders";
import { quotes } from "./quotes";

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  workOrders: many(workOrders),
  quotes: many(quotes),
}));
