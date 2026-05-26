/**
 * Creation/modification date: 26/05/2026
 * Path: src/lib/validators/sat/attachmentSchema.ts
 * Description: Zod schema for work order attachment upload validation.
 */

import { z } from "zod";

export const addAttachmentSchema = z.object({
  workOrderId: z.string().uuid(),
  type: z.enum(["photo", "video", "document", "audio"]),
  isBefore: z.coerce.boolean().default(false),
  caption: z.string().max(500).optional().nullable(),
});

export type AddAttachmentInput = z.infer<typeof addAttachmentSchema>;
