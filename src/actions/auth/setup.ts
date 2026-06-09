/**
 * Creation/modification date: 21/05/2026
 * Path: src/actions/auth/setup.ts
 * Description: Server Action for self-hosted initial setup. Creates first company + owner.
 *              Rate limited: 3 attempts per 5 minutes per IP.
 */

"use server";

import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { setupSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth/auth";
import { SetupAlreadyCompletedError, AuthError } from "@/lib/errors/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function setupAction(rawInput: unknown) {
  try {
    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    const rl = checkRateLimit(`setup:${ip}`, { maxRequests: 3, windowSeconds: 300 });

    if (!rl.allowed) {
      return { success: false, error: "Too many attempts. Please try again later." };
    }

    const input = setupSchema.parse(rawInput);

    const isSetup = await authService.isSetupCompleted();
    if (isSetup) {
      throw new SetupAlreadyCompletedError();
    }

    await authService.createCompanyAndOwner({
      companyName: input.companyName,
      email: input.email,
      password: input.password,
    });

    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Setup failed. Please try again." };
  }
}
