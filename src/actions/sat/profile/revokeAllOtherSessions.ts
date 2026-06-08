/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/revokeAllOtherSessions.ts
 * Description: Server Action that revokes every active session for the
 *              signed-in user except the one matching the current device
 *              fingerprint (user-agent + IP).
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { sessionsService } from "@/services/sat/sessions";
import { getCurrentSessionFingerprint } from "@/lib/auth/currentSession";

export async function revokeAllOtherSessionsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }
    const fingerprint = await getCurrentSessionFingerprint();
    const count = await sessionsService.revokeAllOtherSessions(
      session.user.id,
      fingerprint
    );
    revalidatePath("/settings/profile");
    return { success: true as const, data: { revoked: count } };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
