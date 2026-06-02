/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpSenderFields.tsx
 * Description: Step 3 of the SMTP form — sender identity (fromName, fromEmail).
 *              Optional. Defaults to the SMTP user when left blank.
 */

"use client";

import { useTranslations } from "next-intl";
import { FormField } from "./FormField";

export interface SmtpSenderState {
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
      <h3 className="section-heading">
        <span className="section-heading-step">3</span>
        {t("sections.sender")}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("fields.fromName")} hint={t("fields.fromNameHint")}>
          <input
            type="text"
            value={state.fromName}
            onChange={(e) => onChange({ fromName: e.target.value })}
            placeholder={t("fields.fromNamePlaceholder")}
            disabled={disabled}
            className="input"
          />
        </FormField>
        <FormField label={t("fields.fromEmail")} hint={t("fields.fromEmailHint")}>
          <input
            type="email"
            value={state.fromEmail}
            onChange={(e) => onChange({ fromEmail: e.target.value })}
            placeholder="info@empresa.com"
            disabled={disabled}
            className="input"
          />
        </FormField>
      </div>
    </section>
  );
}
