/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/products.ts
 * Description: Products catalog for SAT and future ERP.
 */

import { pgTable, uuid, text, timestamp, index, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    sku: text("sku"),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
    unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
    stock: integer("stock"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companySkuIdx: index("idx_products_company_sku").on(table.companyId, table.sku),
    companyActiveIdx: index("idx_products_company_active").on(table.companyId, table.isActive),
  })
);

import { workOrderMaterials } from "./workOrderMaterials";
import { quoteItems } from "./quoteItems";

export const productsRelations = relations(products, ({ one, many }) => ({
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  workOrderMaterials: many(workOrderMaterials),
  quoteItems: many(quoteItems),
}));