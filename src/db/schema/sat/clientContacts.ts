/**
 * Creation/modification date: 11/06/2026
 * Path: src/db/schema/sat/clientContacts.ts
 * Description: Client contacts table — multiple contacts per client with roles.
 */

import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { clients } from "./clients";

export const clientContacts = pgTable(
  "client_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    position: text("position"),
    phone: text("phone"),
    email: text("email"),
    isPrimary: boolean("is_primary").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientIdx: index("idx_client_contacts_client_id").on(table.clientId),
  })
);

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
}));
