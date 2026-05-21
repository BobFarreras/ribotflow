/**
 * Creation/modification date: 21/05/2026
 * Path: src/lib/validators/auth.ts
 * Description: Zod schemas for authentication input validation.
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
});

export const setupSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
