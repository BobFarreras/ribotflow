/**
 * Creation/modification date: 24/05/2026
 * Path: src/i18n/routing.ts
 * Description: next-intl routing configuration (default Catalan, no prefix).
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ca", "es"],
  defaultLocale: "ca",
  localePrefix: "never",
});
