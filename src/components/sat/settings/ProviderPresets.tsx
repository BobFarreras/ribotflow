/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/ProviderPresets.tsx
 * Description: Quick-select buttons for common email providers. Filling a
 *              preset overwrites host + port + secure (and never touches the
 *              user/password). Helps non-technical users avoid the most
 *              common misconfigurations.
 */

import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";

export interface SmtpPreset {
  host: string;
  port: number;
  secure: boolean;
}

interface ProviderDef {
  id: keyof typeof I18N_PROVIDER_IDS;
  host: string;
  port: number;
  secure: boolean;
}

const I18N_PROVIDER_IDS = {
  gmail: "gmail",
  outlook: "outlook",
  yahoo: "yahoo",
  hostinger: "hostinger",
  ionos: "ionos",
  custom: "custom",
} as const;

const PROVIDERS: ProviderDef[] = [
  { id: "gmail", host: "smtp.gmail.com", port: 587, secure: false },
  { id: "outlook", host: "smtp-mail.outlook.com", port: 587, secure: false },
  { id: "yahoo", host: "smtp.mail.yahoo.com", port: 587, secure: false },
  { id: "hostinger", host: "smtp.hostinger.com", port: 465, secure: true },
  { id: "ionos", host: "smtp.ionos.es", port: 587, secure: false },
  { id: "custom", host: "", port: 587, secure: false },
];

interface Props {
  onSelect: (preset: SmtpPreset) => void;
}

export function ProviderPresets({ onSelect }: Props) {
  const t = useTranslations("sat.settings.email.providers");

  return (
    <section aria-label={t("title")} className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-start gap-2">
        <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--info)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[color:var(--text)]">{t("title")}</h3>
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{t("subtitle")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((p) => {
          const isCustom = p.id === "custom";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect({ host: p.host, port: p.port, secure: p.secure })}
              className="btn btn-secondary btn-sm"
              aria-label={t(p.id)}
            >
              {isCustom ? (
                <>
                  <span aria-hidden>+</span>
                  {t(p.id)}
                </>
              ) : (
                t(p.id)
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
