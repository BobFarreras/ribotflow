/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/workOrderMaterials.ts
 * Description: Materials consumed during a work order.
 */

import { pgTable, uuid, text, timestamp, index, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workOrders } from "./workOrders";
import { products } from "./products";

export const workOrderMaterials = pgTable(
  "work_order_materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
    unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    woIdx: index("idx_wo_materials_work_order").on(table.workOrderId),
  })
);

export const workOrderMaterialsRelations = relations(workOrderMaterials, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderMaterials.workOrderId],
    references: [workOrders.id],
  }),
  product: one(products, {
    fields: [workOrderMaterials.productId],
    references: [products.id],
  }),
}));
