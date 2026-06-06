/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/useCompanySettingsForm.ts
 * Description: Form state + handlers for the per-company settings form.
 *              - Exposes per-section patch helpers (identity/address/preferences/documents/branding)
 *              - Tracks isDirty / dirtyCount so the floating save bar can show feedback
 *              - Manages save transitions + "just saved" pulse for the success banner
 */

"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { updateCompanySettingsAction } from "@/actions/sat/company/updateCompanySettings";

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

type V = ReturnType<typeof buildInitial>;

function buildInitial(initial: CompanySettingsDTO | null) {
  return {
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
  };
}

export function useCompanySettingsForm(initial: CompanySettingsDTO) {
  const [values, setValues] = useState<V>(() => buildInitial(initial));
  const [initialValues, setInitialValues] = useState<V>(values);
  const [isSaving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isDirty, dirtyCount } = useMemo(() => {
    let count = 0;
    for (const k of Object.keys(values) as (keyof V)[]) {
      if (values[k] !== initialValues[k]) count++;
    }
    return { isDirty: count > 0, dirtyCount: count };
  }, [values, initialValues]);

  const applyIdentityPatch = useCallback((p: Partial<V>) => setValues((v) => ({ ...v, ...p })), []);
  const applyAddressPatch = useCallback((p: Partial<V>) => setValues((v) => ({ ...v, ...p })), []);
  const applyPreferencesPatch = useCallback((p: Partial<V>) => setValues((v) => ({ ...v, ...p })), []);
  const applyDocumentsPatch = useCallback((p: Partial<V>) => setValues((v) => ({ ...v, ...p })), []);
  const applyBrandingPatch = useCallback((p: Partial<V>) => setValues((v) => ({ ...v, ...p })), []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setSaveError(null);
  }, [initialValues]);

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
        setJustSaved(true);
        if (pulseTimer.current) clearTimeout(pulseTimer.current);
        pulseTimer.current = setTimeout(() => setJustSaved(false), 2200);
        toast.success(t("feedback.saved"));
      } else {
        setSaveError(r.error ?? "Error");
        toast.error(`${t("feedback.saveFailed")}: ${r.error ?? ""}`);
      }
    });
  }

  return {
    values, isDirty, dirtyCount, isSaving, saveError, justSaved,
    applyIdentityPatch, applyAddressPatch, applyPreferencesPatch,
    applyDocumentsPatch, applyBrandingPatch, save, reset,
  };
}
