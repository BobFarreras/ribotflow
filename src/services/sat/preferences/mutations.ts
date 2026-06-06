/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/preferences/mutations.ts
 * Description: Write-side helpers for the user preferences table.
 *              Uses a single upsert on the unique `userId` index so
 *              updates are idempotent and never create duplicates.
 */

import { db } from "@/db";
import { userPreferences } from "@/db/schema/sat/userPreferences";
import type { UserPreferencesDto, UpsertPreferencesInput } from "./types";

/**
 * Inserts or updates the user preferences row. Only the fields that are
 * provided are touched. Returns the resulting DTO (with defaults for any
 * fields the caller did not set).
 */
export async function upsertUserPreferences(
  input: UpsertPreferencesInput
): Promise<UserPreferencesDto> {
  const setClause: Partial<typeof userPreferences.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.theme !== undefined) setClause.theme = input.theme;
  if (input.locale !== undefined) setClause.locale = input.locale;

  const [row] = await db
    .insert(userPreferences)
    .values({
      userId: input.userId,
      theme: input.theme ?? "light",
      locale: input.locale ?? "ca",
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: setClause,
    })
    .returning({
      userId: userPreferences.userId,
      theme: userPreferences.theme,
      locale: userPreferences.locale,
    });

  return row;
}
