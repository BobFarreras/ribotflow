/**
 * Creation/modification date: 11/06/2026
 * Path: src/db/schema/sat/clientCategories.ts
 * Description: Client categories table — per-company segmentation for clients.
 */

import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";

export const clientCategories = pgTable(
  "client_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("idx_client_categories_company_id").on(table.companyId),
  })
);

export const clientCategoriesRelations = relations(clientCategories, ({ one }) => ({
  company: one(companies, {
    fields: [clientCategories.companyId],
    references: [companies.id],
  }),
}));
