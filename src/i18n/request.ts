/**
 * Creation/modification date: 24/05/2026
 * Path: src/i18n/request.ts
 * Description: next-intl request configuration with default locale.
 */

import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Default to Catalan; later detect from user preference or cookie
  const locale = "ca";

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
