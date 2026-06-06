/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/preferencesOptions.ts
 * Description: Static lists used by the Preferences section of the
 *              company settings form. Kept separate so the section
 *              component stays under the 150-line cap.
 */

export const LOCALES = [
  { code: "ca", name: "Català" },
  { code: "es", name: "Castellano" },
  { code: "en", name: "English" },
] as const;

export const TIMEZONES = [
  "Europe/Madrid",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Andorra",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Argentina/Buenos_Aires",
] as const;

export const CURRENCIES = [
  { code: "EUR", name: "Euro (€)" },
  { code: "USD", name: "US Dollar ($)" },
  { code: "GBP", name: "British Pound (£)" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "ARS", name: "Argentine Peso" },
] as const;
