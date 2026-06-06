/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/validators/sat/preferencesSchema.ts
 * Description: Zod schemas for the preferences actions. Themes and locales
 *              are tightly scoped: only what the app actually ships is
 *              accepted. If a new locale is added to `routing.locales`,
 *              update the enum here too.
 */

import { z } from "zod";

export const themeSchema = z.enum(["light", "dark"]);

export const localeSchema = z.enum(["ca", "es"]);

export const updatePreferencesSchema = z
  .object({
    theme: themeSchema.optional(),
    locale: localeSchema.optional(),
  })
  .refine((v) => v.theme !== undefined || v.locale !== undefined, {
    message: "At least one of `theme` or `locale` must be provided",
  });

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
