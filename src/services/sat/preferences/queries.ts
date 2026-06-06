/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/preferences/queries.ts
 * Description: Read-side helpers for the user preferences table. Always
 *              fall back to DEFAULT_PREFERENCES if the row does not exist
 *              (a fresh user has no preferences yet).
 */

import { db } from "@/db";
import { userPreferences } from "@/db/schema/sat/userPreferences";
import { eq } from "drizzle-orm";
import {
  DEFAULT_PREFERENCES,
  type UserPreferencesDto,
} from "./types";

/** Returns the preferences for a user, falling back to defaults. */
export async function getUserPreferences(userId: string): Promise<UserPreferencesDto> {
  const [row] = await db
    .select({
      userId: userPreferences.userId,
      theme: userPreferences.theme,
      locale: userPreferences.locale,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return {
      userId,
      theme: DEFAULT_PREFERENCES.theme,
      locale: DEFAULT_PREFERENCES.locale,
    };
  }
  return row;
}
