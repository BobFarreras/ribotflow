/**
 * Creation/modification date: 24/05/2026
 * Path: src/actions/auth/register.ts
 * Description: Server Action for user registration. Creates company + owner user only.
 *              Disabled in self-hosted mode (single-tenant).
 *              Rate limited: 5 attempts per 5 minutes per IP.
 */

"use server";

import { headers } from "next/headers";
import { registerSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth/auth";
import { AuthError } from "@/lib/errors/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function registerAction(rawInput: unknown) {
  try {
    if (process.env.NEXT_PUBLIC_APP_MODE === "self_hosted") {
      return { success: false, error: "Registration is disabled on self-hosted instances." };
    }

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    const rl = checkRateLimit(`register:${ip}`, { maxRequests: 5, windowSeconds: 300 });

    if (!rl.allowed) {
      return { success: false, error: "Too many attempts. Please try again later." };
    }

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
