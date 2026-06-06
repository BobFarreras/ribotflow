/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/profile/queries.ts
 * Description: Read-side operations for the user profile. Always scoped
 *              by (companyId, userId) so the UI cannot read another
 *              tenant's profile by mistake.
 */

import { db } from "@/db";
import { companies, users } from "@/db/schema/auth";
import { and, eq } from "drizzle-orm";
import type { ProfileDto } from "./types";

/**
 * Returns the profile view for the given user inside the given company.
 * Returns null if the user is not in that company (or has been deleted).
 */
export async function getProfile(
  companyId: string,
  userId: string
): Promise<ProfileDto | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      companyId: users.companyId,
      companyName: companies.name,
      companyLogoUrl: companies.logoUrl,
    })
    .from(users)
    .innerJoin(companies, eq(companies.id, users.companyId))
    .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    avatarUrl: r.avatarUrl,
    companyId: r.companyId,
    companyName: r.companyName,
    companyLogoUrl: r.companyLogoUrl,
  };
}

/** Returns only the password hash for a user, or null if not found. */
export async function getPasswordHash(
  companyId: string,
  userId: string
): Promise<string | null> {
  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
    .limit(1);
  return rows[0]?.passwordHash ?? null;
}
