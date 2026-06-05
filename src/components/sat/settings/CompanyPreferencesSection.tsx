/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyPreferencesSection.tsx
 * Description: Section 3 of the company settings form — preferences
 *              (default locale, timezone, currency).
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";

export interface CompanyPreferences {
  defaultLocale: string;
  timezone: string;
  defaultCurrency: string;
}

interface Props {
  state: CompanyPreferences;
  disabled: boolean;
  onChange: (patch: Partial<CompanyPreferences>) => void;
}

const LOCALES = [
  { code: "ca", name: "Català" },
  { code: "es", name: "Castellano" },
  { code: "en", name: "English" },
];

const TIMEZONES = [
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
];

const CURRENCIES = [
  { code: "EUR", name: "Euro (€)" },
  { code: "USD", name: "US Dollar ($)" },
  { code: "GBP", name: "British Pound (£)" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "ARS", name: "Argentine Peso" },
];

export function CompanyPreferencesSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <section>
      <h3 className="section-heading">
        <span className="section-heading-step">3</span>
        {t("sections.preferences")}
      </h3>
      <p className="field-hint mb-3">{t("sections.preferencesHint")}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("fields.defaultLocale")} hint={t("fields.defaultLocaleHint")}>
          <select
            value={state.defaultLocale}
            onChange={(e) => onChange({ defaultLocale: e.target.value })}
            disabled={disabled}
            className="input"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t("fields.timezone")} hint={t("fields.timezoneHint")}>
          <select
            value={state.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            disabled={disabled}
            className="input"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t("fields.defaultCurrency")} hint={t("fields.defaultCurrencyHint")}>
          <select
            value={state.defaultCurrency}
            onChange={(e) => onChange({ defaultCurrency: e.target.value })}
            disabled={disabled}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </section>
  );
}
