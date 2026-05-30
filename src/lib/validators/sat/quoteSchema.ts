/**
 * Creation/modification date: 28/05/2026
 * Path: src/lib/validators/sat/quoteSchema.ts
 * Description: Zod validation schemas for quotes and quote items.
 */

import { z } from "zod";

/* ============================================================
   QUOTE ITEM SCHEMA
   ============================================================ */

export const quoteItemSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid().nullable().optional(),
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().max(20).default("unit"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
  unitCost: z.coerce.number().min(0).nullable().optional(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  category: z.enum(["material", "labor", "travel", "other"]).default("material"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type QuoteItemInput = z.infer<typeof quoteItemSchema>;

/* ============================================================
   CREATE QUOTE SCHEMA
   ============================================================ */

export const createQuoteSchema = z.object({
  workOrderId: z.string().uuid("Invalid work order ID"),
  clientId: z.string().uuid("Invalid client ID"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).nullable().optional(),
  validUntil: z.string().datetime().or(z.string().date()).nullable().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(21),
  notes: z.string().max(2000).nullable().optional(),
  clientNotes: z.string().max(2000).nullable().optional(),
  templateId: z.string().uuid().nullable().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

/* ============================================================
   UPDATE QUOTE SCHEMA
   ============================================================ */

export const updateQuoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  validUntil: z.string().datetime().or(z.string().date()).nullable().optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(2000).nullable().optional(),
  clientNotes: z.string().max(2000).nullable().optional(),
});

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

/* ============================================================
   ADD QUOTE ITEM SCHEMA
   ============================================================ */

export const addQuoteItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().max(20).default("unit"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
  unitCost: z.coerce.number().min(0).nullable().optional(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  category: z.enum(["material", "labor", "travel", "other"]).default("material"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type AddQuoteItemInput = z.infer<typeof addQuoteItemSchema>;

/* ============================================================
   UPDATE QUOTE ITEM SCHEMA
   ============================================================ */

export const updateQuoteItemSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  quantity: z.coerce.number().positive().optional(),
  unit: z.string().max(20).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  unitCost: z.coerce.number().min(0).nullable().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  category: z.enum(["material", "labor", "travel", "other"]).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type UpdateQuoteItemInput = z.infer<typeof updateQuoteItemSchema>;

/* ============================================================
   QUOTE STATUS SCHEMA
   ============================================================ */

export const quoteStatusSchema = z.object({
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "cancelled"]),
  reason: z.string().max(500).nullable().optional(),
});

export type QuoteStatusInput = z.infer<typeof quoteStatusSchema>;

/* ============================================================
   TEMPLATE SCHEMA
   ============================================================ */

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  defaultItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().default("unit"),
        unitPrice: z.number().min(0),
        unitCost: z.number().min(0).optional(),
        category: z.enum(["material", "labor", "travel", "other"]).default("material"),
      })
    )
    .nullable()
    .optional(),
  defaultNotes: z.string().max(2000).nullable().optional(),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(21),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  defaultItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().default("unit"),
        unitPrice: z.number().min(0),
        unitCost: z.number().min(0).optional(),
        category: z.enum(["material", "labor", "travel", "other"]).default("material"),
      })
    )
    .nullable()
    .optional(),
  defaultNotes: z.string().max(2000).nullable().optional(),
  defaultTaxRate: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
