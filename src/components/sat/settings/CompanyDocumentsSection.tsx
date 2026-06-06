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
import { SectionShell } from "./SectionShell";

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
    <SectionShell step={4} title={t("sections.documents")} description={t("sections.documentsDescription")}>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <FormField label={t("fields.quotePrefix")} hint={t("fields.quotePrefixHint")}>
          <input type="text" value={state.quotePrefix}
            onChange={(e) => onChange({ quotePrefix: e.target.value.toUpperCase() })}
            disabled={disabled} className="input max-w-[6rem]" maxLength={10} placeholder="PRE" />
        </FormField>
        <FormField label={t("fields.invoicePrefix")} hint={t("fields.invoicePrefixHint")}>
          <input type="text" value={state.invoicePrefix}
            onChange={(e) => onChange({ invoicePrefix: e.target.value.toUpperCase() })}
            disabled={disabled} className="input max-w-[6rem]" maxLength={10} placeholder="INV" />
        </FormField>
        <FormField label={t("fields.defaultTaxRate")} hint={t("fields.defaultTaxRateHint")}>
          <div className="relative max-w-[7rem]">
            <input type="number" value={state.defaultTaxRate}
              onChange={(e) => onChange({ defaultTaxRate: e.target.value })}
              disabled={disabled} className="input pr-8" min={0} max={100} step="0.5" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--text-muted)]">%</span>
          </div>
        </FormField>
        <FormField label={t("fields.travelRatePerKm")} hint={t("fields.travelRatePerKmHint")}>
          <div className="relative max-w-[8rem]">
            <input type="number" value={state.travelRatePerKm}
              onChange={(e) => onChange({ travelRatePerKm: e.target.value })}
              disabled={disabled} className="input pr-12" min={0} step="0.01" placeholder="0.50" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--text-muted)]">€/km</span>
          </div>
        </FormField>
      </div>
    </SectionShell>
  );
}
