/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpSettingsForm.tsx
 * Description: Redesigned SMTP settings form (Zero-Fricció).
 *              Orchestrator only — sections live in dedicated subcomponents.
 *              Plain-language labels, presets, sectioned layout, test banner.
 */

"use client";

import { useTranslations } from "next-intl";
import { Save, Trash2, Plug } from "lucide-react";
import { SmtpStatusBadge } from "./SmtpStatusBadge";
import { ProviderPresets, type SmtpPreset } from "./ProviderPresets";
import { SmtpTestBanner } from "./SmtpTestBanner";
import { SmtpPermissionNotice } from "./SmtpPermissionNotice";
import { SmtpConnectionFields } from "./SmtpConnectionFields";
import { SmtpSenderFields } from "./SmtpSenderFields";
import { SmtpAdvancedSection } from "./SmtpAdvancedSection";
import { useSmtpSettingsForm } from "./useSmtpSettingsForm";

export interface SmtpConfigDTO {
  id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  acceptSelfSigned: boolean;
  fromName: string | null;
  fromEmail: string | null;
  updatedAt: Date | string;
}

interface Props {
  initialConfig: SmtpConfigDTO | null;
  userRole: "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";
}

export function SmtpSettingsForm({ initialConfig, userRole }: Props) {
  const t = useTranslations("sat.settings.email");
  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN";
  const canEdit = isOwner;
  const canTest = isOwner || isAdmin;

  const {
    state: { host, port, user, password, secure, acceptSelfSigned, fromName, fromEmail, isSaving, isTesting, isDeleting, testResult },
    setters: { setAcceptSelfSigned },
    actions: { save, test, remove },
    applyConnectionPatch,
    applySenderPatch,
    applyPreset,
  } = useSmtpSettingsForm(initialConfig);

  function handlePreset(preset: SmtpPreset) {
    applyPreset(preset);
  }

  return (
    <div className="space-y-6">
      <SmtpStatusBadge configured={!!initialConfig} lastUpdated={initialConfig?.updatedAt} />

      {!canEdit && <SmtpPermissionNotice role={userRole} />}

      {canEdit && <ProviderPresets onSelect={handlePreset} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canEdit) return;
          save(t, () => undefined);
        }}
        className="space-y-6 rounded-lg border border-border bg-surface p-4 sm:p-6"
      >
        <fieldset disabled={!canEdit} className="space-y-6">
          <SmtpConnectionFields
            state={{ host, port, user, password, secure }}
            disabled={!canEdit}
            hasExistingConfig={!!initialConfig}
            onChange={applyConnectionPatch}
          />

          <SmtpSenderFields
            state={{ fromName: fromName ?? "", fromEmail: fromEmail ?? "" }}
            disabled={!canEdit}
            onChange={applySenderPatch}
          />

          <SmtpAdvancedSection
            acceptSelfSigned={acceptSelfSigned}
            disabled={!canEdit}
            onChange={setAcceptSelfSigned}
          />
        </fieldset>

        <SmtpTestBanner result={testResult} />

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {canEdit && (
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              <Save className="h-4 w-4" aria-hidden />
              {isSaving ? t("actions.saving") : t("actions.save")}
            </button>
          )}
          {canTest && (
            <button
              type="button"
              onClick={() => test()}
              disabled={isTesting || !initialConfig}
              className="btn btn-secondary"
            >
              <Plug className="h-4 w-4" aria-hidden />
              {isTesting ? t("actions.testing") : t("actions.test")}
            </button>
          )}
          {canEdit && initialConfig && (
            <button
              type="button"
              onClick={() => remove(t)}
              disabled={isDeleting}
              className="btn btn-ghost"
              style={{ color: "var(--danger)" }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("actions.delete")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
