/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyAddressSection.tsx
 * Description: Section 2 of the company settings form — postal address
 *              (street, city, postal code, country).
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";

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

const COUNTRIES = [
  { code: "ES", name: "Espanya" },
  { code: "PT", name: "Portugal" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italia" },
  { code: "DE", name: "Deutschland" },
  { code: "AD", name: "Andorra" },
  { code: "GB", name: "United Kingdom" },
];

export function CompanyAddressSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <section>
      <h3 className="section-heading">
        <span className="section-heading-step">2</span>
        {t("sections.address")}
      </h3>
      <p className="field-hint mb-3">{t("sections.addressHint")}</p>
      <div className="grid gap-4 sm:grid-cols-6">
        <FormField label={t("fields.addressStreet")} required={false}>
          <input
            type="text"
            value={state.addressStreet}
            onChange={(e) => onChange({ addressStreet: e.target.value })}
            placeholder="Carrer de l'Exemple, 12, 2n 1a"
            disabled={disabled}
            className="input sm:col-span-4"
            autoComplete="street-address"
          />
        </FormField>
        <FormField label={t("fields.addressPostalCode")}>
          <input
            type="text"
            value={state.addressPostalCode}
            onChange={(e) => onChange({ addressPostalCode: e.target.value })}
            placeholder="08001"
            disabled={disabled}
            className="input sm:col-span-2"
            autoComplete="postal-code"
          />
        </FormField>
        <FormField label={t("fields.addressCity")}>
          <input
            type="text"
            value={state.addressCity}
            onChange={(e) => onChange({ addressCity: e.target.value })}
            placeholder="Barcelona"
            disabled={disabled}
            className="input sm:col-span-4"
            autoComplete="address-level2"
          />
        </FormField>
        <FormField label={t("fields.addressCountry")}>
          <select
            value={state.addressCountry}
            onChange={(e) => onChange({ addressCountry: e.target.value })}
            disabled={disabled}
            className="input sm:col-span-2"
            autoComplete="country"
          >
            {COUNTRIES.map((c) => (
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
