/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyPreferencesSection.tsx
 * Description: Section 3 of the company settings form — preferences
 *              (default locale, timezone, currency).
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";
import { SectionShell } from "./SectionShell";
import { LOCALES, TIMEZONES, CURRENCIES } from "./preferencesOptions";

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

export function CompanyPreferencesSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <SectionShell step={3} title={t("sections.preferences")} description={t("sections.preferencesDescription")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t("fields.defaultLocale")} hint={t("fields.defaultLocaleHint")}>
          <select value={state.defaultLocale} onChange={(e) => onChange({ defaultLocale: e.target.value })} disabled={disabled} className="input">
            {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </FormField>
        <FormField label={t("fields.timezone")} hint={t("fields.timezoneHint")}>
          <select value={state.timezone} onChange={(e) => onChange({ timezone: e.target.value })} disabled={disabled} className="input">
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </FormField>
        <FormField label={t("fields.defaultCurrency")} hint={t("fields.defaultCurrencyHint")}>
          <select value={state.defaultCurrency} onChange={(e) => onChange({ defaultCurrency: e.target.value })} disabled={disabled} className="input">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </FormField>
      </div>
    </SectionShell>
  );
}
