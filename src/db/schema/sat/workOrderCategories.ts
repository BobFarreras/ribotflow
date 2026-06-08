/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/workOrderCategories.ts
 * Description: Work order categories configurable per company.
 */

import { pgTable, uuid, text, timestamp, index, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "../auth";

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

import { workOrders } from "./workOrders";
import { quoteTemplates } from "./quoteTemplates";

export const workOrderCategoriesRelations = relations(workOrderCategories, ({ one, many }) => ({
  company: one(companies, {
    fields: [workOrderCategories.companyId],
    references: [companies.id],
  }),
  workOrders: many(workOrders),
  quoteTemplates: many(quoteTemplates),
}));
