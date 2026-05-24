/**
 * Creation/modification date: 24/05/2026
 * Path: src/actions/auth/register.ts
 * Description: Server Action for user registration. Creates company + owner user only.
 */

"use server";

import { registerSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth/auth";
import { AuthError } from "@/lib/errors/auth";

export async function registerAction(rawInput: unknown) {
  try {
    const input = registerSchema.parse(rawInput);

    await authService.createCompanyAndOwner({
      companyName: input.companyName,
      email: input.email,
      password: input.password,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message };
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[registerAction] Unexpected error:", error);
    }

    return { success: false, error: "Registration failed. Please try again." };
  }
}
