/**
 * Creation/modification date: 27/05/2026
 * Path: src/lib/validators/sat/clientSchema.ts
 * Description: Zod validation schema for SAT clients with CRM fields.
 */

import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "El nom és obligatori").max(200),
  email: z.string().email("Email invàlid").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  // CRM fields
  contactPerson: z.string().max(200).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  website: z.string().url("URL invàlida").optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  fiscalData: z
    .object({
      iban: z.string().max(50).optional(),
      activityCode: z.string().max(20).optional(),
      registrationDate: z.string().optional(),
    })
    .optional()
    .nullable(),
  categoryId: z.string().uuid().optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;
