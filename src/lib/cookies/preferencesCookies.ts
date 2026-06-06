/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/cookies/preferencesCookies.ts
 * Description: Cookie helpers for the per-user UI preferences (theme +
 *              locale). The cookies exist so the root layout can render
 *              the correct <html lang> and the anti-FOUC <script> can
 *              apply the right `.dark` class on the very first paint.
 *              The DB is the source of truth; cookies are a read-through
 *              cache that survives logged-out visits.
 *
 *              All helpers are async because Next.js 16 returns
 *              `cookies()` as a Promise.
 */

import { cookies } from "next/headers";
import type { ThemePreference, LocalePreference } from "@/services/sat/preferences/types";
import { DEFAULT_PREFERENCES } from "@/services/sat/preferences/types";

const COOKIE_OPTIONS = {
  httpOnly: false, // must be readable by the anti-FOUC <script> in the browser
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

export const THEME_COOKIE = "ribot_theme";
export const LOCALE_COOKIE = "ribot_locale";

/** Read the theme from the cookie. Falls back to the default. */
export async function readThemeCookie(): Promise<ThemePreference> {
  const store = await cookies();
  const raw = store.get(THEME_COOKIE)?.value;
  return raw === "dark" || raw === "light" ? raw : DEFAULT_PREFERENCES.theme;
}

/** Read the locale from the cookie. Falls back to the default. */
export async function readLocaleCookie(): Promise<LocalePreference> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return raw === "ca" || raw === "es" ? raw : DEFAULT_PREFERENCES.locale;
}

export async function writeThemeCookie(theme: ThemePreference): Promise<void> {
  const store = await cookies();
  store.set(THEME_COOKIE, theme, COOKIE_OPTIONS);
}

export async function writeLocaleCookie(locale: LocalePreference): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS);
}
