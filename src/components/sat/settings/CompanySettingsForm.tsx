/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanySettingsForm.tsx
 * Description: Orchestrator for the company settings page (/settings/company).
 *              Sectioned layout (identity, address, preferences, documents,
 *              branding) with a sticky floating save bar that only appears
 *              when the form is dirty or has just been saved.
 */

"use client";

import { useTranslations } from "next-intl";
import { SmtpPermissionNotice } from "./SmtpPermissionNotice";
import { SmtpStatusBadge } from "./SmtpStatusBadge";
import { CompanyIdentitySection } from "./CompanyIdentitySection";
import { CompanyAddressSection } from "./CompanyAddressSection";
import { CompanyPreferencesSection } from "./CompanyPreferencesSection";
import { CompanyDocumentsSection } from "./CompanyDocumentsSection";
import { CompanyBrandingSection } from "./CompanyBrandingSection";
import { CompanyLogoUploader } from "./CompanyLogoUploader";
import { SaveBar } from "./SaveBar";
import {
  useCompanySettingsForm,
  type CompanySettingsDTO,
} from "./useCompanySettingsForm";

interface Props {
  initial: CompanySettingsDTO;
  userRole: "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";
}

export function CompanySettingsForm({ initial, userRole }: Props) {
  const t = useTranslations("sat.settings.company");
  const canEdit = userRole === "OWNER";

  const {
    values, isDirty, dirtyCount, isSaving, saveError, justSaved,
    applyIdentityPatch, applyAddressPatch, applyPreferencesPatch,
    applyDocumentsPatch, applyBrandingPatch, save, reset,
  } = useCompanySettingsForm(initial);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SmtpStatusBadge configured={!!initial.name} lastUpdated={initial.updatedAt} />
        {!canEdit && <SmtpPermissionNotice role={userRole} />}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canEdit) save(t);
        }}
        className="space-y-6"
      >
        <fieldset disabled={!canEdit} className="space-y-6">
          <CompanyIdentitySection state={pickIdentity(values)} disabled={!canEdit} onChange={applyIdentityPatch} />
          <CompanyAddressSection state={pickAddress(values)} disabled={!canEdit} onChange={applyAddressPatch} />
          <CompanyPreferencesSection state={pickPreferences(values)} disabled={!canEdit} onChange={applyPreferencesPatch} />
          <CompanyDocumentsSection state={pickDocuments(values)} disabled={!canEdit} onChange={applyDocumentsPatch} />
          <CompanyBrandingSection state={{ legalText: values.legalText }} disabled={!canEdit} onChange={applyBrandingPatch} />
          {canEdit && <CompanyLogoUploader currentLogoUrl={initial.logoUrl} disabled={!canEdit} />}
        </fieldset>

        {canEdit && (
          <SaveBar
            isDirty={isDirty}
            dirtyCount={dirtyCount}
            isSaving={isSaving}
            saveError={saveError}
            justSaved={justSaved}
            onReset={reset}
            labels={{
              save: t("actions.save"),
              saving: t("actions.saving"),
              unsaved: t("actions.unsaved"),
              justSaved: t("actions.justSaved"),
              reset: t("actions.reset"),
              change: t("actions.change"),
              changes: t("actions.changes"),
            }}
          />
        )}
      </form>
    </div>
  );
}

type V = ReturnType<typeof useCompanySettingsForm>["values"];
function pickIdentity(v: V) { return { name: v.name, taxId: v.taxId, phone: v.phone, email: v.email, website: v.website }; }
function pickAddress(v: V) { return { addressStreet: v.addressStreet, addressCity: v.addressCity, addressPostalCode: v.addressPostalCode, addressCountry: v.addressCountry }; }
function pickPreferences(v: V) { return { defaultLocale: v.defaultLocale, timezone: v.timezone, defaultCurrency: v.defaultCurrency }; }
function pickDocuments(v: V) { return { quotePrefix: v.quotePrefix, invoicePrefix: v.invoicePrefix, defaultTaxRate: v.defaultTaxRate, travelRatePerKm: v.travelRatePerKm }; }
