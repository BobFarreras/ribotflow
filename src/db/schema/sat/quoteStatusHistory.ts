/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/quoteStatusHistory.ts
 * Description: Quote status change audit log.
 */

import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quotes } from "./quotes";

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

export const quoteStatusHistoryRelations = relations(quoteStatusHistory, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteStatusHistory.quoteId],
    references: [quotes.id],
  }),
}));
