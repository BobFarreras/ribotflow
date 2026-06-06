/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/ProviderPresets.tsx
 * Description: Quick-select buttons for common email providers with brand icons.
 *              Clicking a preset fills host + port + secure (never user/password).
 */

import { useTranslations } from "next-intl";

export interface SmtpPreset {
  host: string;
  port: number;
  secure: boolean;
}

interface ProviderDef {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  i18nKey: string;
  icon: React.ReactNode;
  color: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    i18nKey: "gmail",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"
          fill="currentColor"
        />
      </svg>
    ),
    color: "#EA4335",
  },
  {
    id: "outlook",
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    i18nKey: "outlook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.35 7 12 9.82 4.65 7 12 4.18zM4 8.82l7 3.5V19.5l-7-3.5V8.82zm9 10.68v-7.18l7-3.5v7.18l-7 3.5z"
          fill="currentColor"
        />
      </svg>
    ),
    color: "#0078D4",
  },
  {
    id: "yahoo",
    host: "smtp.mail.yahoo.com",
    port: 587,
    secure: false,
    i18nKey: "yahoo",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"
          fill="currentColor"
        />
      </svg>
    ),
    color: "#6001D2",
  },
  {
    id: "hostinger",
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    i18nKey: "hostinger",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "#6C3BAE",
  },
  {
    id: "ionos",
    host: "smtp.ionos.es",
    port: 587,
    secure: false,
    i18nKey: "ionos",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    color: "#003D8F",
  },
  {
    id: "custom",
    host: "",
    port: 587,
    secure: false,
    i18nKey: "custom",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    color: "var(--text-muted)",
  },
];

interface Props {
  onSelect: (preset: SmtpPreset) => void;
}

export function ProviderPresets({ onSelect }: Props) {
  const t = useTranslations("sat.settings.email.providers");

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-[color:var(--text)]">{t("subtitle")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect({ host: p.host, port: p.port, secure: p.secure })}
            className="flex items-center gap-2.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-left text-sm transition-colors hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
              style={{
                backgroundColor: `color-mix(in srgb, ${p.color} 12%, transparent)`,
                color: p.color,
              }}
            >
              {p.icon}
            </span>
            <span className="font-medium text-[color:var(--text)]">{t(p.i18nKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
