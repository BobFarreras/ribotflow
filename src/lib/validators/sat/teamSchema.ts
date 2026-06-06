/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/validators/sat/teamSchema.ts
 * Description: Zod schemas for the team management actions (invite, role
 *              change, status changes). Every action is its own schema so
 *              the action layer can `safeParse` the raw input and surface
 *              field-level errors to the UI.
 */

import { z } from "zod";

const ROLE_VALUES = ["ADMIN", "TECHNICIAN", "OFFICE"] as const;

/** Owner cannot be invited through the team form — there is only one. */
export const inviteRoleEnum = z.enum(ROLE_VALUES, {
  errorMap: () => ({ message: "Invalid role" }),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  name: z.string().trim().min(1, "Name is required").max(100),
  role: inviteRoleEnum,
});

export const changeUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  role: z.enum(["OWNER", ...ROLE_VALUES] as const, {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export const userIdSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
