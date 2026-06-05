/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyBrandingSection.tsx
 * Description: Section 5 of the company settings form — branding
 *              (legal footer text shown on quotes/invoices).
 *              Logo upload lives in CompanyLogoUploader.
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";

export interface CompanyBranding {
  legalText: string;
}

interface Props {
  state: CompanyBranding;
  disabled: boolean;
  onChange: (patch: Partial<CompanyBranding>) => void;
}

export function CompanyBrandingSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <section>
      <h3 className="section-heading">
        <span className="section-heading-step">5</span>
        {t("sections.branding")}
      </h3>
      <p className="field-hint mb-3">{t("sections.brandingHint")}</p>
      <FormField label={t("fields.legalText")} hint={t("fields.legalTextHint")}>
        <textarea
          value={state.legalText}
          onChange={(e) => onChange({ legalText: e.target.value })}
          disabled={disabled}
          className="textarea"
          maxLength={2000}
          rows={4}
          placeholder={t("fields.legalTextPlaceholder")}
        />
      </FormField>
    </section>
  );
}
