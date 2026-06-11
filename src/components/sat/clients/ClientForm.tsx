/**
 * Creation/modification date: 11/06/2026
 * Path: src/components/sat/clients/ClientForm.tsx
 * Description: Reusable client form component for create and edit modes.
 *              Sections: Client Data, Primary Contact, Fiscal Data, Notes, GPS Location.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Building2,
  User,
  FileText,
  StickyNotes,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  lat: string;
  lng: string;
  contactPerson: string;
  position: string;
  website: string;
  notes: string;
  fiscalIban: string;
  fiscalActivityCode: string;
  fiscalRegistrationDate: string;
  categoryId: string;
}

interface ClientCategory {
  id: string;
  name: string;
  color: string | null;
}

interface ClientFormProps {
  mode: "create" | "edit";
  initialData?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    taxId?: string | null;
    location?: { lat: number; lng: number } | null;
    contactPerson?: string | null;
    position?: string | null;
    website?: string | null;
    notes?: string | null;
    fiscalData?: {
      iban?: string;
      activityCode?: string;
      registrationDate?: string;
    } | null;
    categoryId?: string | null;
  };
  categories?: ClientCategory[];
  onSubmit: (data: ClientFormData) => Promise<{ success: boolean; error?: string }>;
  cancelHref: string;
}

function toFormValue(val: string | null | undefined): string {
  return val ?? "";
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]";

function SectionHeader({
  icon: Icon,
  title,
  isOpen,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between border-b border-[var(--border)] pb-2 text-left"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--module-sat)]" />
        <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
      )}
    </button>
  );
}

export function ClientForm({
  mode,
  initialData,
  categories = [],
  onSubmit,
  cancelHref,
}: ClientFormProps) {
  const router = useRouter();
  const t = useTranslations("sat.clients");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState({
    client: true,
    contact: false,
    fiscal: false,
    notes: false,
    gps: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData?.name ?? "",
    email: toFormValue(initialData?.email),
    phone: toFormValue(initialData?.phone),
    address: toFormValue(initialData?.address),
    taxId: toFormValue(initialData?.taxId),
    lat: initialData?.location?.lat?.toString() ?? "",
    lng: initialData?.location?.lng?.toString() ?? "",
    contactPerson: toFormValue(initialData?.contactPerson),
    position: toFormValue(initialData?.position),
    website: toFormValue(initialData?.website),
    notes: toFormValue(initialData?.notes),
    fiscalIban: toFormValue(initialData?.fiscalData?.iban),
    fiscalActivityCode: toFormValue(initialData?.fiscalData?.activityCode),
    fiscalRegistrationDate: toFormValue(initialData?.fiscalData?.registrationDate),
    categoryId: initialData?.categoryId ?? "",
  });

  const update = (field: keyof ClientFormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await onSubmit(formData);

    setIsLoading(false);

    if (result.success) {
      router.push(cancelHref);
      router.refresh();
    } else {
      setError(result.error ?? t("form.error"));
    }
  };

  const isEdit = mode === "edit";

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href={cancelHref}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold text-[var(--text)]">
            {isEdit ? t("form.editTitle") : t("form.createTitle")}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Section 1: Client Data */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
            <SectionHeader
              icon={Building2}
              title={t("form.sectionClient")}
              isOpen={openSections.client}
              onToggle={() => toggleSection("client")}
            />
            {openSections.client && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      {t("form.name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder={t("form.namePlaceholder")}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      {t("form.email")}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder={t("form.emailPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      {t("form.phone")}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder={t("form.phonePlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      {t("form.address")}
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder={t("form.addressPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      {t("form.taxId")}
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => update("taxId", e.target.value)}
                      placeholder={t("form.taxIdPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      {t("form.website")}
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => update("website", e.target.value)}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>
                  {categories.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                        {t("form.category")}
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => update("categoryId", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">{t("form.categoryNone")}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Section 2: Primary Contact */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
            <SectionHeader
              icon={User}
              title={t("form.sectionContact")}
              isOpen={openSections.contact}
              onToggle={() => toggleSection("contact")}
            />
            {openSections.contact && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                    {t("form.contactPerson")}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => update("contactPerson", e.target.value)}
                    placeholder={t("form.contactPersonPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                    {t("form.position")}
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => update("position", e.target.value)}
                    placeholder={t("form.positionPlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Fiscal Data */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
            <SectionHeader
              icon={FileText}
              title={t("form.sectionFiscal")}
              isOpen={openSections.fiscal}
              onToggle={() => toggleSection("fiscal")}
            />
            {openSections.fiscal && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                    {t("form.iban")}
                  </label>
                  <input
                    type="text"
                    value={formData.fiscalIban}
                    onChange={(e) => update("fiscalIban", e.target.value)}
                    placeholder="ES91 2100 0418 4502 0005 1332"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                    {t("form.activityCode")}
                  </label>
                  <input
                    type="text"
                    value={formData.fiscalActivityCode}
                    onChange={(e) => update("fiscalActivityCode", e.target.value)}
                    placeholder="4321"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                    {t("form.registrationDate")}
                  </label>
                  <input
                    type="date"
                    value={formData.fiscalRegistrationDate}
                    onChange={(e) => update("fiscalRegistrationDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Notes */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
            <SectionHeader
              icon={StickyNotes}
              title={t("form.sectionNotes")}
              isOpen={openSections.notes}
              onToggle={() => toggleSection("notes")}
            />
            {openSections.notes && (
              <textarea
                value={formData.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder={t("form.notesPlaceholder")}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            )}
          </div>

          {/* Section 5: GPS Location */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
            <SectionHeader
              icon={MapPin}
              title={t("form.sectionGps")}
              isOpen={openSections.gps}
              onToggle={() => toggleSection("gps")}
            />
            {openSections.gps && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => update("lat", e.target.value)}
                    placeholder={t("form.latPlaceholder")}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => update("lng", e.target.value)}
                    placeholder={t("form.lngPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)]">{t("form.gpsHint")}</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={cancelHref}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              {t("form.cancel")}
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.name}
              className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? t("form.save") : t("form.create")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
