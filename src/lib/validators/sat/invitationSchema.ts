/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/validators/sat/invitationSchema.ts
 * Description: Zod schema for the public /accept-invitation form.
 *              The token is read from the URL query, the password
 *              fields come from the form.
 */

import { z } from "zod";

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(10, "Invalid invitation token"),
    password: z.string().min(8, "La contrasenya ha de tenir com a mínim 8 caràcters"),
    confirmPassword: z.string().min(8, "La contrasenya ha de tenir com a mínim 8 caràcters"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Les contrasenyes no coincideixen",
    path: ["confirmPassword"],
  });

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
