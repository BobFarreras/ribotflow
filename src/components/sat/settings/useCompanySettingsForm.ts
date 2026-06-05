/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/useCompanySettingsForm.ts
 * Description: Form state + handlers for the per-company settings form.
 *              - Exposes per-section patch helpers (identity/address/preferences/documents/branding)
 *              - Manages save transitions + toast surface
 *              - Tracks "isDirty" so users know if they have unsaved changes
 */

"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  updateCompanySettingsAction,
} from "@/actions/sat/company/updateCompanySettings";

export interface CompanySettingsDTO {
  id: string;
  name: string;
  tenantSlug: string;
  plan: "free" | "plus" | "enterprise";
  taxId: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressCountry: string;
  logoUrl: string | null;
  legalText: string | null;
  defaultTaxRate: string;
  defaultCurrency: string;
  defaultLocale: string;
  timezone: string;
  quotePrefix: string;
  invoicePrefix: string;
  travelRatePerKm: string | null;
  updatedAt: Date;
}

export function useCompanySettingsForm(initial: CompanySettingsDTO | null) {
  const [values, setValues] = useState(() => ({
    name: initial?.name ?? "",
    taxId: initial?.taxId ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    website: initial?.website ?? "",

    addressStreet: initial?.addressStreet ?? "",
    addressCity: initial?.addressCity ?? "",
    addressPostalCode: initial?.addressPostalCode ?? "",
    addressCountry: initial?.addressCountry ?? "ES",

    legalText: initial?.legalText ?? "",

    defaultTaxRate: initial?.defaultTaxRate ?? "21",
    defaultCurrency: initial?.defaultCurrency ?? "EUR",
    defaultLocale: initial?.defaultLocale ?? "ca",
    timezone: initial?.timezone ?? "Europe/Madrid",

    quotePrefix: initial?.quotePrefix ?? "PRE",
    invoicePrefix: initial?.invoicePrefix ?? "INV",
    travelRatePerKm: initial?.travelRatePerKm ?? "",
  }));
  const [initialValues, setInitialValues] = useState(values);
  const [isSaving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => Object.keys(values).some((k) => values[k as keyof typeof values] !== initialValues[k as keyof typeof initialValues]),
    [values, initialValues]
  );

  function applyIdentityPatch(p: Partial<typeof values>) {
    setValues((v) => ({ ...v, ...p }));
  }
  function applyAddressPatch(p: Partial<typeof values>) {
    setValues((v) => ({ ...v, ...p }));
  }
  function applyPreferencesPatch(p: Partial<typeof values>) {
    setValues((v) => ({ ...v, ...p }));
  }
  function applyDocumentsPatch(p: Partial<typeof values>) {
    setValues((v) => ({ ...v, ...p }));
  }
  function applyBrandingPatch(p: Partial<typeof values>) {
    setValues((v) => ({ ...v, ...p }));
  }

  function save(t: (k: string) => string) {
    setSaveError(null);
    startSave(async () => {
      const r = await updateCompanySettingsAction({
        name: values.name,
        taxId: values.taxId || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        addressStreet: values.addressStreet || null,
        addressCity: values.addressCity || null,
        addressPostalCode: values.addressPostalCode || null,
        addressCountry: values.addressCountry,
        legalText: values.legalText || null,
        defaultTaxRate: Number(values.defaultTaxRate) || 21,
        defaultCurrency: values.defaultCurrency,
        defaultLocale: values.defaultLocale as "ca" | "es" | "en",
        timezone: values.timezone,
        quotePrefix: values.quotePrefix,
        invoicePrefix: values.invoicePrefix,
        travelRatePerKm: values.travelRatePerKm ? Number(values.travelRatePerKm) : null,
      });
      if (r.success) {
        setInitialValues(values);
        toast.success(t("feedback.saved"));
      } else {
        setSaveError(r.error ?? "Error");
        toast.error(`${t("feedback.saveFailed")}: ${r.error ?? ""}`);
      }
    });
  }

  return {
    values,
    isDirty,
    isSaving,
    saveError,
    applyIdentityPatch,
    applyAddressPatch,
    applyPreferencesPatch,
    applyDocumentsPatch,
    applyBrandingPatch,
    setLogoUrl: (url: string | null) => {
      // Only re-render the relevant value; not in `values` since logo is stored
      // in a separate state below the hook consumer.
    },
    save,
  };
}
