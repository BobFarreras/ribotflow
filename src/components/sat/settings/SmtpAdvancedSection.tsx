/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpAdvancedSection.tsx
 * Description: Collapsible advanced options (currently: acceptSelfSigned).
 *              Kept collapsed by default so non-technical users see a
 *              clean form. A warning badge surfaces when an advanced
 *              option is active.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { FormCheckbox } from "./FormField";

interface Props {
  acceptSelfSigned: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}

export function SmtpAdvancedSection({ acceptSelfSigned, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.email");
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-border bg-[color:var(--surface-hover)]/40 px-3 py-2 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-hover)]"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={"h-4 w-4 transition-transform duration-150 " + (open ? "rotate-180" : "")}
            aria-hidden
          />
          {t("sections.advanced")}
        </span>
        {acceptSelfSigned && <span className="badge badge-warning">Cert. propi</span>}
      </button>
      {open && (
        <div className="mt-3 space-y-2 rounded-md border border-border bg-[color:var(--surface-hover)]/30 p-3">
          <FormCheckbox
            label={t("fields.acceptSelfSigned")}
            hint={t("fields.acceptSelfSignedHint")}
            checked={acceptSelfSigned}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      )}
    </section>
  );
}
