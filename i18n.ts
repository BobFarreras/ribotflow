/**
 * Creation/modification date: 24/05/2026
 * Path: src/i18n.ts
 * Description: next-intl configuration entrypoint.
 */

import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "ca";

  const common = (await import(`./src/locales/${locale}/common.json`)).default;
  const sat = (await import(`./src/locales/${locale}/sat.json`)).default;

  return {
    locale,
    messages: {
      ...common,
      sat,
    },
  };
});
