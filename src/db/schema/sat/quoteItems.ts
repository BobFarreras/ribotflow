/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/quoteItems.ts
 * Description: Quote line items.
 */

import { pgTable, uuid, text, timestamp, index, integer, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quotes } from "./quotes";
import { products } from "./products";

export const quoteItems = pgTable(
  "quote_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .references(() => quotes.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
    unit: text("unit").default("unit").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0").notNull(),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("21").notNull(),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    category: text("category")
      .$type<"material" | "labor" | "travel" | "other">()
      .default("material")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    quoteIdx: index("idx_quote_items_quote").on(table.quoteId),
    productIdx: index("idx_quote_items_product").on(table.productId),
  })
);

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
  product: one(products, {
    fields: [quoteItems.productId],
    references: [products.id],
  }),
}));
