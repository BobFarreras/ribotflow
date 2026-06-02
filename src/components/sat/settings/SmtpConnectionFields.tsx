/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpConnectionFields.tsx
 * Description: Steps 1 + 2 of the SMTP form — server connection (host, port,
 *              secure) and credentials (user, password). Password has a
 *              show/hide toggle. Designed for non-technical users.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FormField, FormCheckbox } from "./FormField";

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
    <div className="space-y-6">
      <section>
        <h3 className="section-heading">
          <span className="section-heading-step">1</span>
          {t("sections.server")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label={t("fields.host")} hint={t("fields.hostHint")} required>
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
          </FormField>
          <FormField label={t("fields.port")} hint={t("fields.portHint")}>
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
          </FormField>
          <div className="flex items-end">
            <FormCheckbox
              label={t("fields.secure")}
              hint={t("fields.secureHint")}
              checked={state.secure}
              onChange={(v) => onChange({ secure: v })}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="section-heading">
          <span className="section-heading-step">2</span>
          {t("sections.credentials")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("fields.user")} hint={t("fields.userHint")} required>
            <input
              type="email"
              autoComplete="username"
              value={state.user}
              onChange={(e) => onChange({ user: e.target.value })}
              placeholder="info@empresa.com"
              disabled={disabled}
              className="input"
              required
            />
          </FormField>
          <FormField label={t("fields.password")} hint={t("fields.passwordHint")} required>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]"
                aria-hidden
              />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={state.password}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder={hasExistingConfig ? "••••••••" : "Contrasenya"}
                disabled={disabled}
                className="input pl-8 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Amagar la contrasenya" : "Mostrar la contrasenya"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded text-[color:var(--text-muted)] hover:bg-[color:var(--surface-hover)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
        </div>
      </section>
    </div>
  );
}
