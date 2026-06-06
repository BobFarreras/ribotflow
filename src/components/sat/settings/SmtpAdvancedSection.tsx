/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpAdvancedSection.tsx
 * Description: Step 4 of the SMTP form — advanced settings (self-signed certs).
 *              Collapsible section with clear explanation.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ShieldAlert } from "lucide-react";

interface Props {
  acceptSelfSigned: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

export function SmtpAdvancedSection({ acceptSelfSigned, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.email");
  const [open, setOpen] = useState(true);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <ShieldAlert className="h-4 w-4 text-[color:var(--warning)]" aria-hidden />
        <span className="text-sm font-medium text-[color:var(--text)]">
          {t("sections.advanced")}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-[color:var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-hover)] p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptSelfSigned}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded border-[color:var(--border)]"
            />
            <div>
              <span className="text-sm font-medium text-[color:var(--text)]">
                {t("fields.acceptSelfSigned")}
              </span>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                {t("fields.acceptSelfSignedHint")}
              </p>
            </div>
          </label>
        </div>
      )}
    </section>
  );
}
