/**
 * Creation/modification date: 21/05/2026
 * Path: src/actions/auth/logout.ts
 * Description: Server Action for user logout.
 */

"use server";

import { signOut } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function logoutAction() {
  try {
    await signOut({ redirectTo: "/login" });
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return { success: false, error: "Logout failed" };
  }
}
