/**
 * Data de creació/modificació: 28/05/2026
 * Ruta: src/db/schema/sat.ts
 * Descripció: Esquema de dades del Mòdul SAT (Servei d'Assistència Tècnica).
 *               Clients, categories d'ordre, ordres de treball, materials,
 *               adjunts, firmes, historial d'estats, geolocalització,
 *               pressupostos (quotes), línies de pressupost i plantilles.
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
  unique,
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
   FIRMA BIOMÈTRICA (Genèrica per a qualsevol entitat)
   ============================================================ */

export const signatures = pgTable(
  "signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    signedBy: text("signed_by").notNull(),
    signatureSvg: text("signature_svg").notNull(),
    signaturePngUrl: text("signature_png_url"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: jsonb("location").$type<{ lat: number; lng: number }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    companyEntityIdx: index("idx_signatures_company_entity").on(
      table.companyId,
      table.entityType,
      table.entityId
    ),
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
   PRESSUPOTOS (Quotes vinculats a OTs)
   ============================================================ */

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "set null" }),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "set null" })
      .notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status")
      .$type<
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      >()
      .default("draft")
      .notNull(),
    version: integer("version").default(1).notNull(),
    validUntil: timestamp("valid_until"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0").notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("21").notNull(),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("EUR").notNull(),
    notes: text("notes"),
    clientNotes: text("client_notes"),
    templateId: uuid("template_id"),
    pdfUrl: text("pdf_url"),
    sentAt: timestamp("sent_at"),
    acceptedAt: timestamp("accepted_at"),
    acceptedByName: text("accepted_by_name"),
    acceptedByEmail: text("accepted_by_email"),
    signaturePngUrl: text("signature_png_url"),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyStatusIdx: index("idx_quotes_company_status").on(table.companyId, table.status),
    companyCreatedIdx: index("idx_quotes_company_created").on(table.companyId, table.createdAt),
    workOrderIdx: index("idx_quotes_work_order").on(table.workOrderId),
    clientIdx: index("idx_quotes_client").on(table.clientId),
    numberUnique: unique("idx_quotes_number_unique").on(table.companyId, table.number),
  })
);

/* ============================================================
   LÍNIES DE PRESSUPOST (Items del pressupost)
   ============================================================ */

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

/* ============================================================
   PLANTILLES DE PRESSUPOST
   ============================================================ */

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

/* ============================================================
   HISTORIAL D'ESTATS PRESSUPOST (genèric amb entity)
   ============================================================ */

export const quoteStatusHistory = pgTable(
  "quote_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .references(() => quotes.id, { onDelete: "cascade" })
      .notNull(),
    statusFrom: text("status_from"),
    statusTo: text("status_to").notNull(),
    changedBy: uuid("changed_by").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    quoteCreatedIdx: index("idx_quote_status_history_quote_created").on(
      table.quoteId,
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
  quotes: many(quotes),
}));

export const workOrderCategoriesRelations = relations(workOrderCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [workOrderCategories.companyId],
    references: [companies.id],
  }),
  workOrders: many(workOrders),
  quoteTemplates: many(quoteTemplates),
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
  locations: many(workOrderLocations),
  quotes: many(quotes),
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
  product: one(products, {
    fields: [workOrderMaterials.productId],
    references: [products.id],
  }),
}));

export const workOrderAttachmentsRelations = relations(workOrderAttachments, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderAttachments.workOrderId],
    references: [workOrders.id],
  }),
}));



export const workOrderLocationsRelations = relations(workOrderLocations, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderLocations.workOrderId],
    references: [workOrders.id],
  }),
}));

/* ============================================================
   RELACIONS PRODUCTES
   ============================================================ */

export const productsRelations = relations(products, ({ one, many }) => ({
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  workOrderMaterials: many(workOrderMaterials),
  quoteItems: many(quoteItems),
}));

/* ============================================================
   RELACIONS PRESSUPOTOS
   ============================================================ */

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  company: one(companies, {
    fields: [quotes.companyId],
    references: [companies.id],
  }),
  workOrder: one(workOrders, {
    fields: [quotes.workOrderId],
    references: [workOrders.id],
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  template: one(quoteTemplates, {
    fields: [quotes.templateId],
    references: [quoteTemplates.id],
  }),
  items: many(quoteItems),
  statusHistory: many(quoteStatusHistory),
}));

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

export const quoteStatusHistoryRelations = relations(quoteStatusHistory, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteStatusHistory.quoteId],
    references: [quotes.id],
  }),
}));
