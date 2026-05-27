/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/lib/validators/sat/workOrderSchema.ts
 * Descripció: Esquemes Zod per a validació d'ordres de treball.
 */

import { z } from "zod";

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const createWorkOrderSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().max(2000, "Description too long").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium").optional(),
  scheduledDate: z.string().transform((val) => {
    if (!val) return undefined;
    // datetime-local HTML5 format: "YYYY-MM-DDTHH:mm" → append seconds + Z
    if (val.length === 16) {
      return `${val}:00Z`;
    }
    return val;
  }).optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(480).optional(),
  notes: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  location: locationSchema.optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  assignedTo: z.string().uuid().optional().nullable(),
});

export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;

export const updateStatusSchema = z.object({
  workOrderId: z.string().uuid(),
  status: z.enum([
    "pending",
    "assigned",
    "in_progress",
    "paused",
    "completed",
    "closed",
    "cancelled",
  ]),
  reason: z.string().max(500).optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
