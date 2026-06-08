/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/sessions/mutations.ts
 * Description: Write-side helpers for managing the active-sessions list.
 *              A "revoke" is a hard DELETE on the row. The current
 *              session is identified by a best-effort fingerprint
 *              (user-agent + IP) because Auth.js JWT strategy does not
 *              expose a stable session-token cookie.
 */

import { db } from "@/db";
import { sessions } from "@/db/schema/auth";
import { and, eq, ne, isNull, or } from "drizzle-orm";
import type { SessionFingerprint } from "@/lib/auth/currentSession";

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
 * does not belong to the user, or if it matches the current fingerprint.
 */
export async function revokeSession(
  userId: string,
  sessionId: string,
  currentFingerprint: SessionFingerprint
): Promise<void> {
  // Prevent revoking the session that matches the current device
  const [match] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId),
        fingerprintWhere(currentFingerprint)
      )
    )
    .limit(1);

  if (match) {
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
 * Revokes every active session for the user except the one that matches
 * the current fingerprint. Returns the number of sessions deleted.
 * If the fingerprint cannot be matched, ALL sessions are deleted
 * (the user will have to log in again, which is acceptable).
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentFingerprint: SessionFingerprint
): Promise<number> {
  const currentRows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), fingerprintWhere(currentFingerprint)))
    .limit(1);

  const currentId = currentRows[0]?.id;

  if (!currentId) {
    // Fingerprint not found — delete everything (safe fallback)
    const deleted = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
      .returning({ id: sessions.id });
    return deleted.length;
  }

  const deleted = await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, currentId)))
    .returning({ id: sessions.id });

  return deleted.length;
}

/* ---------- helpers ---------- */

function fingerprintWhere(fp: SessionFingerprint) {
  const conds = [];
  if (fp.userAgent !== null) {
    conds.push(eq(sessions.userAgent, fp.userAgent));
  } else {
    conds.push(isNull(sessions.userAgent));
  }
  if (fp.ipAddress !== null) {
    conds.push(eq(sessions.ipAddress, fp.ipAddress));
  } else {
    conds.push(isNull(sessions.ipAddress));
  }
  return and(...conds);
}
