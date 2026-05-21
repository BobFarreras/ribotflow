/**
 * Creation/modification date: 21/05/2026
 * Path: src/actions/auth/setup.ts
 * Description: Server Action for self-hosted initial setup. Creates first company + owner.
 */

"use server";

import { signIn } from "@/lib/auth";
import { setupSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth/auth";
import { SetupAlreadyCompletedError, AuthError } from "@/lib/errors/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function setupAction(rawInput: unknown) {
  try {
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
