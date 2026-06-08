/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/workOrderStatusHistory.ts
 * Description: Work order status change audit log.
 */

import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workOrders } from "./workOrders";

export const workOrderStatusHistory = pgTable(
  "work_order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull(),
    statusFrom: text("status_from"),
    statusTo: text("status_to").notNull(),
    changedBy: uuid("changed_by").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    woCreatedIdx: index("idx_wo_status_history_work_order_created").on(
      table.workOrderId,
      table.createdAt
    ),
  })
);

export const workOrderStatusHistoryRelations = relations(workOrderStatusHistory, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderStatusHistory.workOrderId],
    references: [workOrders.id],
  }),
}));
