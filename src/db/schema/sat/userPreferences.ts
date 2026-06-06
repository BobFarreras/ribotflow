/**
 * Creation/modification date: 06/06/2026
 * Path: src/db/schema/sat/userPreferences.ts
 * Description: Per-user UI preferences (theme + UI language). The auth
 *              session JWT only carries an immutable identity; these
 *              settings live in a dedicated table so the user can change
 *              them at any time without invalidating the session.
 *              Multi-tenancy is inherited from the FK to `users`.
 */

import { pgTable, uuid, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "../auth";

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** One row per user. Cascade on user deletion. */
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** Light or dark. No "system" for now to keep the anti-FOUC script trivial. */
    theme: text("theme").$type<"light" | "dark">().default("light").notNull(),
    /** UI language. "ca" or "es" — the only locales the app currently ships. */
    locale: text("locale").$type<"ca" | "es">().default("ca").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdUnique: uniqueIndex("idx_user_preferences_user_id_unique").on(table.userId),
    companyLookupIdx: index("idx_user_preferences_company_lookup").on(table.userId),
  })
);

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));
