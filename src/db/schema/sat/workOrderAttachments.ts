/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/workOrderAttachments.ts
 * Description: Work order attachments (photos, videos, documents, audio).
 */

import { pgTable, uuid, text, timestamp, index, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workOrders } from "./workOrders";

export const workOrderAttachments = pgTable(
  "work_order_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    type: text("type").$type<"photo" | "video" | "document" | "audio">().notNull(),
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull(),
    url: text("url"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    location: jsonb("location").$type<{
      lat: number;
      lng: number;
      accuracy?: number;
    }>(),
    isBefore: boolean("is_before").default(false).notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    woTypeIdx: index("idx_wo_attachments_work_order_type").on(table.workOrderId, table.type),
    woCreatedIdx: index("idx_wo_attachments_work_order_created").on(
      table.workOrderId,
      table.createdAt
    ),
  })
);

export const workOrderAttachmentsRelations = relations(workOrderAttachments, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderAttachments.workOrderId],
    references: [workOrders.id],
  }),
}));
