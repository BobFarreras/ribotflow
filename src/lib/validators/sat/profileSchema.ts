/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/validators/sat/profileSchema.ts
 * Description: Zod schemas for the profile Server Actions.
 */

import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const avatarUploadMetaSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\/(png|jpeg|webp|svg\+xml)$/, "Unsupported format"),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024),
});

export type UpdateNameInput = z.infer<typeof updateNameSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
