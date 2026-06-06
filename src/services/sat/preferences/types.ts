/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/preferences/types.ts
 * Description: DTOs and enums for the per-user UI preferences (theme + locale).
 */

export type ThemePreference = "light" | "dark";
export type LocalePreference = "ca" | "es";

/** Default values applied when a user has no row yet. */
export const DEFAULT_PREFERENCES = {
  theme: "light" as const,
  locale: "ca" as const,
};

export interface UserPreferencesDto {
  userId: string;
  theme: ThemePreference;
  locale: LocalePreference;
}

export interface UpsertPreferencesInput {
  userId: string;
  theme?: ThemePreference;
  locale?: LocalePreference;
}
