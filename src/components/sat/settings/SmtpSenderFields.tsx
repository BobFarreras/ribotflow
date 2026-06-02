/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpSenderFields.tsx
 * Description: Step 3 of the SMTP form — sender identity (fromName, fromEmail).
 */

"use client";

import { useTranslations } from "next-intl";
import { UserCircle } from "lucide-react";

interface SmtpSenderState {
  fromName: string;
  fromEmail: string;
}

interface Props {
  state: SmtpSenderState;
  disabled: boolean;
  onChange: (patch: Partial<SmtpSenderState>) => void;
}

export function SmtpSenderFields({ state, disabled, onChange }: Props) {
  const t = useTranslations("sat.settings.email");

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary)] text-sm font-bold text-white">
          3
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--text)]">
            {t("sections.sender")}
          </h3>
          <p className="text-xs text-[color:var(--text-muted)]">
            {t("sections.senderHint")}
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
            {t("fields.fromName")}
          </label>
          <input
            type="text"
            autoComplete="name"
            value={state.fromName}
            onChange={(e) => onChange({ fromName: e.target.value })}
            placeholder={t("fields.fromNamePlaceholder")}
            disabled={disabled}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
            {t("fields.fromEmail")}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={state.fromEmail}
            onChange={(e) => onChange({ fromEmail: e.target.value })}
            placeholder={t("fields.fromEmailPlaceholder")}
            disabled={disabled}
            className="input"
          />
        </div>
      </div>
    </section>
  );
}