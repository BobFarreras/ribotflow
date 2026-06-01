/**
 * Creation/modification date: 01/06/2026
 * Path: src/db/schema/sat/signatures.ts
 * Description: Generic biometric signatures for any entity.
 */

import { pgTable, uuid, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { companies } from "../auth";

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

/* No dedicated relations — signatures are generic polymorphic entities. */
