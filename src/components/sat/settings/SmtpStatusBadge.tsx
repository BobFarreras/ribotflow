/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpStatusBadge.tsx
 * Description: Status banner for the SMTP config. Shows whether it's active
 *              or not, plus the last update time when configured.
 */

import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  configured: boolean;
  lastUpdated?: Date | string | null;
}

export function SmtpStatusBadge({ configured, lastUpdated }: Props) {
  const t = useTranslations("sat.settings.email.status");

  const icon = configured ? (
    <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" aria-hidden />
  ) : (
    <AlertCircle className="h-5 w-5 text-[color:var(--warning)]" aria-hidden />
  );

  const label = configured ? t("configured") : t("notConfigured");
  const detail = configured ? t("configuredDetail") : t("notConfiguredDetail");

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[color:var(--text)]">{label}</span>
          {configured && lastUpdated && (
            <span className="text-xs text-[color:var(--text-muted)]">
              · {t("lastUpdated", { date: new Date(lastUpdated).toLocaleString() })}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-[color:var(--text-muted)]">{detail}</p>
      </div>
    </div>
  );
}
