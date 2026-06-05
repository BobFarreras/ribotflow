/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyDocumentsSection.tsx
 * Description: Section 4 of the company settings form — defaults for
 *              generated documents (quote/invoice prefixes, tax rate,
 *              travel billing rate).
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";

export interface CompanyDocuments {
  quotePrefix: string;
  invoicePrefix: string;
  defaultTaxRate: string;
  travelRatePerKm: string;
}

interface Props {
  state: CompanyDocuments;
  disabled: boolean;
  onChange: (patch: Partial<CompanyDocuments>) => void;
}

export function CompanyDocumentsSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <section>
      <h3 className="section-heading">
        <span className="section-heading-step">4</span>
        {t("sections.documents")}
      </h3>
      <p className="field-hint mb-3">{t("sections.documentsHint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("fields.quotePrefix")} hint={t("fields.quotePrefixHint")}>
          <input
            type="text"
            value={state.quotePrefix}
            onChange={(e) => onChange({ quotePrefix: e.target.value.toUpperCase() })}
            disabled={disabled}
            className="input"
            maxLength={10}
            placeholder="PRE"
          />
        </FormField>
        <FormField label={t("fields.invoicePrefix")} hint={t("fields.invoicePrefixHint")}>
          <input
            type="text"
            value={state.invoicePrefix}
            onChange={(e) => onChange({ invoicePrefix: e.target.value.toUpperCase() })}
            disabled={disabled}
            className="input"
            maxLength={10}
            placeholder="INV"
          />
        </FormField>
        <FormField label={t("fields.defaultTaxRate")} hint={t("fields.defaultTaxRateHint")}>
          <div className="relative">
            <input
              type="number"
              value={state.defaultTaxRate}
              onChange={(e) => onChange({ defaultTaxRate: e.target.value })}
              disabled={disabled}
              className="input pr-8"
              min={0}
              max={100}
              step="0.5"
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[color:var(--text-muted)]">
              %
            </span>
          </div>
        </FormField>
        <FormField label={t("fields.travelRatePerKm")} hint={t("fields.travelRatePerKmHint")}>
          <div className="relative">
            <input
              type="number"
              value={state.travelRatePerKm}
              onChange={(e) => onChange({ travelRatePerKm: e.target.value })}
              disabled={disabled}
              className="input pr-10"
              min={0}
              step="0.01"
              placeholder="0.50"
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[color:var(--text-muted)]">
              €/km
            </span>
          </div>
        </FormField>
      </div>
    </section>
  );
}
