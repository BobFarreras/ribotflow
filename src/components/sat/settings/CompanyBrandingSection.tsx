/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyBrandingSection.tsx
 * Description: Section 5 of the company settings form — branding
 *              (legal footer text shown on quotes/invoices).
 *              Logo upload lives in CompanyLogoUploader.
 */

"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { FormField } from "./FormField";
import { SectionShell } from "./SectionShell";

export interface CompanyBranding {
  legalText: string;
}

interface Props {
  state: CompanyBranding;
  disabled: boolean;
  onChange: (patch: Partial<CompanyBranding>) => void;
}

const MAX_LEGAL_TEXT = 2000;

export function CompanyBrandingSection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");
  const charCount = state.legalText.length;

  return (
    <SectionShell step={5} title={t("sections.branding")} description={t("sections.brandingDescription")}>
      <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-[color:var(--info)]/30 bg-[color:var(--info)]/8 p-3 text-sm text-[color:var(--text)]">
        <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--info)]" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium text-[color:var(--text)]">{t("sections.brandingWhyTitle")}</p>
          <p className="text-[color:var(--text-muted)]">{t("sections.brandingWhyBody")}</p>
        </div>
      </div>

      <FormField label={t("fields.legalText")} hint={t("fields.legalTextHint")}>
        <textarea
          value={state.legalText}
          onChange={(e) => onChange({ legalText: e.target.value.slice(0, MAX_LEGAL_TEXT) })}
          disabled={disabled}
          className="textarea"
          maxLength={MAX_LEGAL_TEXT}
          rows={5}
          placeholder={t("fields.legalTextPlaceholder")}
        />
        <div className="mt-1 flex justify-end text-xs text-[color:var(--text-muted)]">
          {charCount} / {MAX_LEGAL_TEXT}
        </div>
      </FormField>
    </SectionShell>
  );
}
