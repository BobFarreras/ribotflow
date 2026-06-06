/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyAddressSection.tsx
 * Description: Section 2 of the company settings form — fiscal address
 *              (street, postal code, city, province, country). Layout
 *              redesigned so postal code + city share a row, and the
 *              country selector lists the 30 most common destinations
 *              with localised names.
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";
import { SectionShell } from "./SectionShell";
import { COUNTRIES } from "./countries";

export interface CompanyAddress {
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
}

interface Props {
  state: CompanyAddress;
  disabled: boolean;
  onChange: (patch: Partial<CompanyAddress>) => void;
}

export function CompanyAddressSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <SectionShell step={2} title={t("sections.address")} description={t("sections.addressDescription")}>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <FormField label={t("fields.addressStreet")} hint={t("fields.addressStreetHint")}>
            <input
              type="text"
              value={state.addressStreet}
              onChange={(e) => onChange({ addressStreet: e.target.value })}
              placeholder="Carrer de l'Exemple, 12, 2n 1a"
              disabled={disabled}
              className="input"
              autoComplete="street-address"
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField label={t("fields.addressPostalCode")}>
            <input
              type="text"
              value={state.addressPostalCode}
              onChange={(e) => onChange({ addressPostalCode: e.target.value })}
              placeholder="08001"
              disabled={disabled}
              className="input max-w-[7rem]"
              autoComplete="postal-code"
              maxLength={12}
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField label={t("fields.addressCity")}>
            <input
              type="text"
              value={state.addressCity}
              onChange={(e) => onChange({ addressCity: e.target.value })}
              placeholder="Barcelona"
              disabled={disabled}
              className="input max-w-[12rem]"
              autoComplete="address-level2"
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField label={t("fields.addressCountry")} hint={t("fields.addressCountryHint")}>
            <select
              value={state.addressCountry}
              onChange={(e) => onChange({ addressCountry: e.target.value })}
              disabled={disabled}
              className="input cursor-pointer max-w-[10rem]"
              autoComplete="country"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>
    </SectionShell>
  );
}
