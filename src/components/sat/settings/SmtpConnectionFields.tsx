/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpConnectionFields.tsx
 * Description: Steps 1 + 2 of the SMTP form — server connection and credentials.
 *              Uses project CSS vars (--border, --surface, --text, etc.).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Server, Shield } from "lucide-react";

export interface SmtpConnectionState {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
}

interface Props {
  state: SmtpConnectionState;
  disabled: boolean;
  hasExistingConfig: boolean;
  onChange: (patch: Partial<SmtpConnectionState>) => void;
}

export function SmtpConnectionFields({ state, disabled, hasExistingConfig, onChange }: Props) {
  const t = useTranslations("sat.settings.email");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-8">
      {/* Server section */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary)] text-sm font-bold text-white">
            1
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--text)]">
              {t("sections.server")}
            </h3>
            <p className="text-xs text-[color:var(--text-muted)]">{t("fields.hostHint")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
              {t("fields.host")} <span className="text-[color:var(--danger)]">*</span>
            </label>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={state.host}
              onChange={(e) => onChange({ host: e.target.value })}
              placeholder={t("fields.hostPlaceholder")}
              disabled={disabled}
              className="input"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
              {t("fields.port")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={state.port}
              onChange={(e) => onChange({ port: parseInt(e.target.value, 10) || 587 })}
              disabled={disabled}
              className="input"
              min={1}
              max={65535}
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2.5 text-sm text-[color:var(--text)]">
          <input
            type="checkbox"
            checked={state.secure}
            onChange={(e) => onChange({ secure: e.target.checked })}
            disabled={disabled}
            className="h-4 w-4 rounded border-[color:var(--border)]"
          />
          <Shield className="h-4 w-4 text-[color:var(--text-muted)]" aria-hidden />
          <span>{t("fields.secure")}</span>
        </label>
        <p className="mt-1 pl-7 text-xs text-[color:var(--text-muted)]">{t("fields.secureHint")}</p>
      </section>

      {/* Credentials section */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary)] text-sm font-bold text-white">
            2
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--text)]">
              {t("sections.credentials")}
            </h3>
            <p className="text-xs text-[color:var(--text-muted)]">{t("fields.userHint")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
              {t("fields.user")} <span className="text-[color:var(--danger)]">*</span>
            </label>
            <input
              type="email"
              autoComplete="username"
              value={state.user}
              onChange={(e) => onChange({ user: e.target.value })}
              placeholder={t("fields.userPlaceholder")}
              disabled={disabled}
              className="input"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
              {t("fields.password")} <span className="text-[color:var(--danger)]">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={state.password}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder={hasExistingConfig ? "••••••••" : t("fields.passwordPlaceholder")}
                disabled={disabled}
                className="input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-[color:var(--text-muted)] hover:bg-[color:var(--surface-hover)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              {t("fields.passwordHint")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
