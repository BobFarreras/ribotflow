/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/quoteTemplates.ts
 * Description: Quote templates configurable per company.
 */

import { pgTable, uuid, text, timestamp, index, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";
import { workOrderCategories } from "./workOrderCategories";

export const quoteTemplates = pgTable(
  "quote_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: uuid("category_id")
      .references(() => workOrderCategories.id, { onDelete: "set null" }),
    defaultItems: jsonb("default_items").$type<
      Array<{
        description: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        unitCost?: number;
        category: "material" | "labor" | "travel" | "other";
      }>
    >(),
    defaultNotes: text("default_notes"),
    defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).default("21").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyActiveIdx: index("idx_templates_company_active").on(table.companyId, table.isActive),
    categoryIdx: index("idx_templates_category").on(table.categoryId),
  })
);

export const quoteTemplatesRelations = relations(quoteTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [quoteTemplates.companyId],
    references: [companies.id],
  }),
  category: one(workOrderCategories, {
    fields: [quoteTemplates.categoryId],
    references: [workOrderCategories.id],
  }),
}));
