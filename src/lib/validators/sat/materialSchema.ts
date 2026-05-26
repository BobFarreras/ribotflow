/**
 * Creation/modification date: 26/05/2026
 * Path: src/lib/validators/sat/materialSchema.ts
 * Description: Zod schema for work order material validation.
 */

import { z } from "zod";

export const addMaterialSchema = z.object({
  workOrderId: z.string().uuid(),
  name: z.string().min(1, "Material name is required").max(200),
  quantity: z.coerce.number().positive("Quantity must be positive").max(999999),
  unitPrice: z.coerce.number().positive().optional().nullable(),
  unitCost: z.coerce.number().positive().optional().nullable(),
  productId: z.string().uuid().optional().nullable(),
});

export type AddMaterialInput = z.infer<typeof addMaterialSchema>;
