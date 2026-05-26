/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/db/schema/sat.ts
 * Descripció: Esquema de dades del Mòdul SAT (Servei d'Assistència Tècnica).
 *               Clients, categories d'ordre, ordres de treball, materials,
 *               adjunts, firmes, historial d'estats i geolocalització.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  integer,
  boolean,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./auth";

/* ============================================================
   CLIENTS (compartit amb CRM futur)
   ============================================================ */

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

/* ============================================================
   CATEGORIES D'ORDRE DE TREBALL (configurables per empresa)
   ============================================================ */

export const workOrderCategories = pgTable(
  "work_order_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    icon: text("icon"),
    isDefault: boolean("is_default").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companySlugIdx: index("idx_wo_categories_company_slug").on(table.companyId, table.slug),
    companySortIdx: index("idx_wo_categories_company_sort").on(table.companyId, table.sortOrder),
  })
);

/* ============================================================
   PRODUCTES (catàleg mínim per a SAT i futur ERP)
   ============================================================ */

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

/* ============================================================
   ORDRES DE TREBALL (nucli del SAT)
   ============================================================ */

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

/* ============================================================
   HISTORIAL D'ESTATS (audit log)
   ============================================================ */

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

/* ============================================================
   MATERIALS CONSUMITS
   ============================================================ */

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

/* ============================================================
   ADJUNTS (fotos, vídeos, documents)
   ============================================================ */

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

/* ============================================================
   FIRMA BIOMÈTRICA
   ============================================================ */

export const workOrderSignatures = pgTable(
  "work_order_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    signedBy: text("signed_by").notNull(),
    signatureSvg: text("signature_svg").notNull(),
    signaturePngUrl: text("signature_png_url"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: jsonb("location").$type<{ lat: number; lng: number }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    woIdx: index("idx_wo_signatures_work_order").on(table.workOrderId),
  })
);

/* ============================================================
   GEOLOCALITZACIÓ / TRACKING
   ============================================================ */

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

/* ============================================================
   RELACIONS (Drizzle ORM)
   ============================================================ */

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  workOrders: many(workOrders),
}));

export const workOrderCategoriesRelations = relations(workOrderCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [workOrderCategories.companyId],
    references: [companies.id],
  }),
  workOrders: many(workOrders),
}));

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
  signature: one(workOrderSignatures),
  locations: many(workOrderLocations),
}));

export const workOrderStatusHistoryRelations = relations(workOrderStatusHistory, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderStatusHistory.workOrderId],
    references: [workOrders.id],
  }),
}));

export const workOrderMaterialsRelations = relations(workOrderMaterials, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderMaterials.workOrderId],
    references: [workOrders.id],
  }),
}));

export const workOrderAttachmentsRelations = relations(workOrderAttachments, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderAttachments.workOrderId],
    references: [workOrders.id],
  }),
}));

export const workOrderSignaturesRelations = relations(workOrderSignatures, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderSignatures.workOrderId],
    references: [workOrders.id],
  }),
}));

export const workOrderLocationsRelations = relations(workOrderLocations, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderLocations.workOrderId],
    references: [workOrders.id],
  }),
}));
