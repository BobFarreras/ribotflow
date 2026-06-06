/**
 * Creation/modification date: 06/06/2026
 * Path: src/i18n/request.ts
 * Description: next-intl request configuration. Reads the active locale
 *              from the `ribot_locale` cookie, falling back to the
 *              default. The cookie is set by the preferences Server
 *              Action so the value is in sync with the per-user
 *              `user_preferences` row in the DB.
 */

import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, readLocaleCookie } from "@/lib/cookies/preferencesCookies";

export default getRequestConfig(async () => {
  const locale = await readLocaleCookie();

  const common = (await import(`../locales/${locale}/common.json`)).default;
  const sat = (await import(`../locales/${locale}/sat.json`)).default;

  return {
    locale,
    messages: {
      ...common,
      sat,
    },
  };
});

// Keep the constant exported in case other modules want to import it
// (e.g. test fixtures) without going through the cookie.
export { LOCALE_COOKIE };
