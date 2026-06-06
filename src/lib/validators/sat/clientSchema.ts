/**
 * Creation/modification date: 27/05/2026
 * Path: src/lib/validators/sat/clientSchema.ts
 * Description: Zod validation schema for SAT clients.
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
});

export type ClientInput = z.infer<typeof clientSchema>;
