/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/sessions/queries.ts
 * Description: Read-side helpers for the active-sessions list. Always
 *              returns the active (non-expired) rows for a given user.
 */

import { db } from "@/db";
import { sessions } from "@/db/schema/auth";
import { and, eq, gt, desc } from "drizzle-orm";
import type { ActiveSessionDto } from "./types";

/**
 * Returns the active sessions for a user, sorted by `lastUsedAt` desc
 * (most recently used first).
 */
export async function listActiveSessions(userId: string): Promise<ActiveSessionDto[]> {
  const rows = await db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      lastUsedAt: sessions.lastUsedAt,
      expires: sessions.expires,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expires, new Date())))
    .orderBy(desc(sessions.lastUsedAt));
  return rows;
}
