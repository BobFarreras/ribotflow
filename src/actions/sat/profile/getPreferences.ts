/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/getPreferences.ts
 * Description: Server Action that returns the preferences for the
 *              signed-in user. The DB row is created lazily on the
 *              first write; this read just falls back to defaults.
 */

"use server";

import { auth } from "@/lib/auth";
import { preferencesService } from "@/services/sat/preferences";

export async function getPreferencesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }
    const data = await preferencesService.getUserPreferences(session.user.id);
    return { success: true as const, data };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
