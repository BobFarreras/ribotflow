/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/team/queries.ts
 * Description: Read-side operations for the team service. All queries are
 *              strictly scoped by companyId (multi-tenancy).
 */

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { and, desc, eq, ne } from "drizzle-orm";
import type { TeamMember } from "./types";

/**
 * Returns every user belonging to `companyId`, newest first.
 * Includes inactive and pending users so the team page can show invitations
 * and suspended accounts at a glance.
 */
export async function listTeamMembers(companyId: string): Promise<TeamMember[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      invitedBy: users.invitedBy,
      invitedAt: users.invitedAt,
      invitationExpiresAt: users.invitationExpiresAt,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.companyId, companyId))
    .orderBy(desc(users.createdAt));

  return rows.map((r) => ({
    ...r,
    role: r.role,
  }));
}

/** Returns the user row by id, scoped to companyId. Null if not found. */
export async function findTeamMember(
  companyId: string,
  userId: string
): Promise<TeamMember | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      invitedBy: users.invitedBy,
      invitedAt: users.invitedAt,
      invitationExpiresAt: users.invitationExpiresAt,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)))
    .limit(1);

  return rows[0] ?? null;
}

/** Returns the email of a user inside the same company. Used to look up
 *  the inviter's name when rendering "Invited by …". */
export async function findUserName(companyId: string, userId: string): Promise<string | null> {
  const rows = await db
    .select({ name: users.name })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)))
    .limit(1);
  return rows[0]?.name ?? null;
}

/** Returns true if there is already an OWNER in the company. */
export async function companyHasOwner(companyId: string): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, "OWNER")))
    .limit(1);
  return rows.length > 0;
}

/** Returns the count of non-pending members inside the company. Used to
 *  block the OWNER from deactivating themselves if they are the last admin. */
export async function countActiveAdminsExcluding(
  companyId: string,
  userId: string
): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.status, "active"),
        ne(users.id, userId)
      )
    );
  return rows.length;
}
