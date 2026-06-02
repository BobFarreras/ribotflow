/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/db/schema/auth.ts
 * Descripció: Esquema de dades relacional per al control de Multi-tenancy i Rols (RBAC).
 */

import { pgTable, uuid, text, timestamp, index, jsonb, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    tenantSlug: text("tenant_slug").notNull().unique(),
    plan: text("plan").$type<"free" | "plus" | "enterprise">().default("free").notNull(),
    taxId: text("tax_id"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    addressStreet: text("address_street"),
    addressCity: text("address_city"),
    addressPostalCode: text("address_postal_code"),
    addressCountry: text("address_country").default("ES"),
    logoUrl: text("logo_url"),
    legalText: text("legal_text"),
    companyAddress: text("company_address"),
    companyLocation: jsonb("company_location").$type<{ lat: number; lng: number }>(),
    defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).default("21"),
    defaultCurrency: text("default_currency").default("EUR"),
    defaultLocale: text("default_locale").default("ca"),
    timezone: text("timezone").default("Europe/Madrid"),
    quotePrefix: text("quote_prefix").default("PRE"),
    invoicePrefix: text("invoice_prefix").default("INV"),
    travelRatePerKm: numeric("travel_rate_per_km", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantSlugIdx: index("idx_companies_tenant_slug").on(table.tenantSlug),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").$type<"OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE">().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("idx_users_company_id").on(table.companyId),
    emailIdx: index("idx_users_email").on(table.email),
  })
);

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: text("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires").notNull(),
  sessionToken: text("session_token").notNull().unique(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
