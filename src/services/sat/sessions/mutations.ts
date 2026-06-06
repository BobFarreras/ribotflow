/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/sessions/mutations.ts
 * Description: Write-side helpers for managing the active-sessions list.
 *              A "revoke" is a hard DELETE on the row. The current
 *              session is identified by its primary key (NOT the
 *              sessionToken) so the user can never accidentally
 *              terminate their own browser.
 */

import { db } from "@/db";
import { sessions } from "@/db/schema/auth";
import { and, eq, ne } from "drizzle-orm";

/** Errors raised by the sessions service. */
export class SessionNotFoundError extends Error {
  readonly code = "session_not_found";
  constructor() {
    super("Session not found");
  }
}

export class CannotRevokeCurrentSessionError extends Error {
  readonly code = "cannot_revoke_current_session";
  constructor() {
    super("Use the logout action to end your current session");
  }
}

/**
 * Revokes a single session by its primary key. Throws if the session
 * does not belong to the user, or if it is the current session.
 */
export async function revokeSession(
  userId: string,
  sessionId: string,
  currentSessionId: string
): Promise<void> {
  if (sessionId === currentSessionId) {
    throw new CannotRevokeCurrentSessionError();
  }
  const result = await db
    .delete(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .returning({ id: sessions.id });
  if (result.length === 0) {
    throw new SessionNotFoundError();
  }
}

/**
 * Revokes every active session for the user except the current one.
 * Returns the number of sessions that were deleted.
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        ne(sessions.id, currentSessionId)
      )
    )
    .returning({ id: sessions.id });
  return deleted.length;
}
