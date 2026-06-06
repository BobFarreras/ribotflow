/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/listActiveSessions.ts
 * Description: Server Action that returns the active (non-expired)
 *              sessions for the signed-in user, sorted by most recently
 *              used. The current session is marked with `isCurrent`.
 */

"use server";

import { auth } from "@/lib/auth";
import { sessionsService } from "@/services/sat/sessions";
import { getCurrentSessionId } from "@/lib/auth/currentSession";

export async function listActiveSessionsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }
    const [rows, currentSessionId] = await Promise.all([
      sessionsService.listActiveSessions(session.user.id),
      getCurrentSessionId(),
    ]);
    return {
      success: true as const,
      data: {
        sessions: rows,
        currentSessionId,
      },
    };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
