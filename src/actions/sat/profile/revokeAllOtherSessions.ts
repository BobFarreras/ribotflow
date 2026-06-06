/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/revokeAllOtherSessions.ts
 * Description: Server Action that revokes every active session for the
 *              signed-in user except the current one.
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { sessionsService } from "@/services/sat/sessions";
import { getCurrentSessionId } from "@/lib/auth/currentSession";

export async function revokeAllOtherSessionsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }
    const currentSessionId = await getCurrentSessionId();
    if (!currentSessionId) {
      return { success: false as const, error: "No active session" };
    }
    const count = await sessionsService.revokeAllOtherSessions(
      session.user.id,
      currentSessionId
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
