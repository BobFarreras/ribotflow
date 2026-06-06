/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/getProfile.ts
 * Description: Returns the profile of the currently signed-in user. Read
 *              access: any authenticated user (gated by the page auth
 *              check). The user can only see their own profile.
 */

"use server";

import { auth } from "@/lib/auth";
import { profileService } from "@/services/sat/profile";

export async function getProfileAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const data = await profileService.getProfile(
      session.user.companyId,
      session.user.id
    );
    if (!data) return { success: false, error: "Profile not found" };
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
