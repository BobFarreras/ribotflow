/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyIdentitySection.tsx
 * Description: Section 1 of the company settings form — identity
 *              (name, tax ID, phone, email, website).
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";
import { SectionShell } from "./SectionShell";

export interface CompanyIdentity {
  name: string;
  taxId: string;
  phone: string;
  email: string;
  website: string;
}

interface Props {
  state: CompanyIdentity;
  disabled: boolean;
  onChange: (patch: Partial<CompanyIdentity>) => void;
}

export function CompanyIdentitySection({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.company");

  return (
    <SectionShell step={1} title={t("sections.identity")} description={t("sections.identityDescription")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("fields.name")} hint={t("fields.nameHint")} required>
          <input type="text" value={state.name} onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Reparacions Ribot, SL" disabled={disabled} className="input" required />
        </FormField>
        <FormField label={t("fields.taxId")} hint={t("fields.taxIdHint")}>
          <input type="text" value={state.taxId} onChange={(e) => onChange({ taxId: e.target.value.toUpperCase() })}
            placeholder="B12345678" disabled={disabled} className="input" maxLength={20} />
        </FormField>
        <FormField label={t("fields.phone")} hint={t("fields.phoneHint")}>
          <input type="tel" value={state.phone} onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+34 600 000 000" disabled={disabled} className="input" autoComplete="tel" />
        </FormField>
        <FormField label={t("fields.email")} hint={t("fields.emailHint")}>
          <input type="email" value={state.email} onChange={(e) => onChange({ email: e.target.value })}
            placeholder="info@empresa.com" disabled={disabled} className="input" autoComplete="email" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label={t("fields.website")} hint={t("fields.websiteHint")}>
            <input type="url" value={state.website} onChange={(e) => onChange({ website: e.target.value })}
              placeholder="https://www.empresa.com" disabled={disabled} className="input" autoComplete="url" />
          </FormField>
        </div>
      </div>
    </SectionShell>
  );
}
