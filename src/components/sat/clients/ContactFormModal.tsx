/**
 * Creation/modification date: 11/06/2026
 * Path: src/components/sat/clients/ContactFormModal.tsx
 * Description: Modal dialog to add or edit a client contact.
 *              Handles both create and update via Server Actions.
 */

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContactAction, updateContactAction } from "@/actions/sat/clients/manageContacts";

export interface ContactFormData {
  name: string;
  position: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  notes: string;
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  contact?: {
    id: string;
    name: string;
    position: string | null;
    phone: string | null;
    email: string | null;
    isPrimary: boolean;
    notes: string | null;
  } | null;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]";

export function ContactFormModal({
  isOpen,
  onClose,
  clientId,
  contact,
  onSaved,
}: ContactFormModalProps) {
  const t = useTranslations("sat.clients.form");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    position: "",
    phone: "",
    email: "",
    isPrimary: false,
    notes: "",
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        position: contact.position ?? "",
        phone: contact.phone ?? "",
        email: contact.email ?? "",
        isPrimary: contact.isPrimary,
        notes: contact.notes ?? "",
      });
    } else {
      setFormData({
        name: "",
        position: "",
        phone: "",
        email: "",
        isPrimary: false,
        notes: "",
      });
    }
  }, [contact, isOpen]);

  if (!isOpen || typeof window === "undefined") return null;

  const isEdit = !!contact;

  const update = (field: keyof ContactFormData, value: string | boolean) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      position: formData.position.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      isPrimary: formData.isPrimary,
      notes: formData.notes.trim() || null,
    };

    const result = isEdit
      ? await updateContactAction(contact!.id, payload)
      : await createContactAction(clientId, payload);

    setIsLoading(false);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error ?? t("contactError"));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={isLoading ? undefined : onClose} />

      <div className="relative mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--module-sat)]/10">
              <UserCircle className="h-4 w-4 text-[var(--module-sat)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              {isEdit ? t("contactEdit") : t("contactNew")}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              {t("contactName")} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t("contactNamePlaceholder")}
              required
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                {t("position")}
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => update("position", e.target.value)}
                placeholder={t("positionPlaceholder")}
                disabled={isLoading}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder={t("phonePlaceholder")}
                disabled={isLoading}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              {t("email")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={t("emailPlaceholder")}
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              {t("notes")}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={2}
              disabled={isLoading}
              className={`${inputClass} resize-none`}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => update("isPrimary", e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--module-sat)]"
            />
            <span className="text-sm text-[var(--text)]">{t("contactIsPrimary")}</span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)] disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? t("save") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
