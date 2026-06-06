/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpStatusBadge.tsx
 * Description: Status banner showing whether SMTP is configured.
 *              Green checkmark or orange warning, with last update time.
 */

"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  configured: boolean;
  lastUpdated?: Date | string | null;
}

export function SmtpStatusBadge({ configured, lastUpdated }: Props) {
  const t = useTranslations("sat.settings.email.status");

  if (configured) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-4">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--success)]"
          aria-hidden
        />
        <div>
          <span className="text-sm font-semibold text-[color:var(--success)]">
            {t("configured")}
          </span>
          {lastUpdated && (
            <span className="ml-2 text-xs text-[color:var(--text-muted)]">
              {t("lastUpdated", { date: new Date(lastUpdated).toLocaleString() })}
            </span>
          )}
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{t("configuredDetail")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 p-4">
      <AlertCircle
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--warning)]"
        aria-hidden
      />
      <div>
        <span className="text-sm font-semibold text-[color:var(--warning)]">
          {t("notConfigured")}
        </span>
        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{t("notConfiguredDetail")}</p>
      </div>
    </div>
  );
}
