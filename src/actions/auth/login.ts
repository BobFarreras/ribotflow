/**
 * Creation/modification date: 21/05/2026
 * Path: src/actions/auth/login.ts
 * Description: Server Action for user login via credentials.
 */

"use server";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validators/auth";
import { AuthError } from "@/lib/errors/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function loginAction(rawInput: unknown) {
  try {
    const input = loginSchema.parse(rawInput);

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

    return { success: false, error: "Invalid email or password" };
  }
}
