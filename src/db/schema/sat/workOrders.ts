/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/workOrders.ts
 * Description: Work orders — core of the SAT module.
 */

import { pgTable, uuid, text, timestamp, index, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";
import { clients } from "./clients";
import { workOrderCategories } from "./workOrderCategories";

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "set null" })
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => workOrderCategories.id, { onDelete: "set null" })
      .notNull(),
    assignedTo: uuid("assigned_to"),
    createdBy: uuid("created_by").notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status")
      .$type<
        | "pending"
        | "assigned"
        | "scheduled"
        | "in_progress"
        | "paused"
        | "completed"
        | "closed"
        | "cancelled"
        | "waiting_parts"
        | "waiting_client"
      >()
      .default("pending")
      .notNull(),
    priority: text("priority")
      .$type<"low" | "medium" | "high" | "urgent">()
      .default("medium")
      .notNull(),
    scheduledDate: timestamp("scheduled_date"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    closedAt: timestamp("closed_at"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
    actualDurationMinutes: integer("actual_duration_minutes"),
    notes: text("notes"),
    signatureUrl: text("signature_url"),
    signatureAt: timestamp("signature_at"),
    pdfUrl: text("pdf_url"),
    travelDistanceKm: numeric("travel_distance_km", { precision: 10, scale: 2 }),
    travelDurationMinutes: integer("travel_duration_minutes"),
    address: text("address"),
    location: jsonb("location").$type<{ lat: number; lng: number }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyStatusIdx: index("idx_wo_company_status").on(table.companyId, table.status),
    companyAssignedIdx: index("idx_wo_company_assigned").on(table.companyId, table.assignedTo),
    companyClientIdx: index("idx_wo_company_client").on(table.companyId, table.clientId),
    numberIdx: index("idx_wo_number").on(table.companyId, table.number),
  })
);

import { workOrderStatusHistory } from "./workOrderStatusHistory";
import { workOrderMaterials } from "./workOrderMaterials";
import { workOrderAttachments } from "./workOrderAttachments";
import { workOrderLocations } from "./workOrderLocations";
import { quotes } from "./quotes";

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  company: one(companies, {
    fields: [workOrders.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [workOrders.clientId],
    references: [clients.id],
  }),
  category: one(workOrderCategories, {
    fields: [workOrders.categoryId],
    references: [workOrderCategories.id],
  }),
  statusHistory: many(workOrderStatusHistory),
  materials: many(workOrderMaterials),
  attachments: many(workOrderAttachments),
  locations: many(workOrderLocations),
  quotes: many(quotes),
}));