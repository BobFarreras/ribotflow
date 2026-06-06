/**
 * Creation/modification date: 27/05/2026
 * Path: src/lib/validators/sat/categorySchema.ts
 * Description: Zod validation schema for work order categories.
 */

import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "El nom és obligatori").max(100),
  slug: z
    .string()
    .min(1, "El slug és obligatori")
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Només lletres minúscules, números, guions i guions baixos"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
  isDefault: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
