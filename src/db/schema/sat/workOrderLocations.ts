/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/workOrderLocations.ts
 * Description: Work order location tracking and geolocation events.
 */

import { pgTable, uuid, text, timestamp, index, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workOrders } from "./workOrders";

export const workOrderLocations = pgTable(
  "work_order_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    eventType: text("event_type")
      .$type<"check_in" | "check_out" | "location_update" | "route_point">()
      .notNull(),
    lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
    lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
    accuracy: numeric("accuracy", { precision: 5, scale: 2 }),
    altitude: numeric("altitude", { precision: 8, scale: 2 }),
    batteryLevel: integer("battery_level"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    woEventCreatedIdx: index("idx_wo_locations_work_order_event_created").on(
      table.workOrderId,
      table.eventType,
      table.createdAt
    ),
  })
);

export const workOrderLocationsRelations = relations(workOrderLocations, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderLocations.workOrderId],
    references: [workOrders.id],
  }),
}));
