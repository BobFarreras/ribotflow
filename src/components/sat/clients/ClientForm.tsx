/**
 * Creation/modification date: 11/06/2026
 * Path: src/components/sat/clients/ClientForm.tsx
 * Description: Reusable client form component for create and edit modes.
 *              Uses CSS vars, i18n keys, and follows project patterns.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  lat: string;
  lng: string;
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
  };
  onSubmit: (data: ClientFormData) => Promise<{ success: boolean; error?: string }>;
  cancelHref: string;
}

function toFormValue(val: string | null | undefined): string {
  return val ?? "";
}

export function ClientForm({ mode, initialData, onSubmit, cancelHref }: ClientFormProps) {
  const router = useRouter();
  const t = useTranslations("sat.clients");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData?.name ?? "",
    email: toFormValue(initialData?.email),
    phone: toFormValue(initialData?.phone),
    address: toFormValue(initialData?.address),
    taxId: toFormValue(initialData?.taxId),
    lat: initialData?.location?.lat?.toString() ?? "",
    lng: initialData?.location?.lng?.toString() ?? "",
  });

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
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              {t("form.name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("form.namePlaceholder")}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                {t("form.email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder={t("form.emailPlaceholder")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                {t("form.phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder={t("form.phonePlaceholder")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              {t("form.address")}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder={t("form.addressPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              {t("form.taxId")}
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData((p) => ({ ...p, taxId: e.target.value }))}
              placeholder={t("form.taxIdPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
            />
          </div>

          {/* GPS coordinates */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
              <MapPin className="h-3.5 w-3.5" />
              {t("form.gps")}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData((p) => ({ ...p, lat: e.target.value }))}
                placeholder={t("form.latPlaceholder")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData((p) => ({ ...p, lng: e.target.value }))}
                placeholder={t("form.lngPlaceholder")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {t("form.gpsHint")}
            </p>
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
